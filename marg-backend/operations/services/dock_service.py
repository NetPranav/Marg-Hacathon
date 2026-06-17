"""
Dock Reservation Service — handles reserving and releasing dock bays for shipments.
"""
from django.utils import timezone
from common.enums import (
    ShipmentStatus, ShipmentEventType, DockStatus,
    ReservationStatus, NotificationType, AuditAction,
)
from operations.models import ShipmentEvent, DockReservation
from operations.services.state_machine import transition_shipment
from notifications.services import notify_warehouse_managers, notify_factory_managers
from audit.services import log_action
from realtime.broadcast import broadcast_shipment_update
from shipments.serializers import ShipmentSerializer


class DockReservationError(Exception):
    pass


def reserve_dock(shipment, dock, performed_by, ip_address=None):
    """
    Reserve a dock bay for a shipment.

    Validations:
    - Dock must belong to the shipment's destination warehouse.
    - Dock must be AVAILABLE.
    - No active reservation must exist for this dock.
    - Shipment must be in DRIVER_ASSIGNED status.
    """
    # Validation: dock belongs to destination warehouse
    if dock.warehouse != shipment.destination_warehouse:
        raise DockReservationError(
            'Dock does not belong to the shipment\'s destination warehouse.'
        )

    # Validation: dock availability
    if dock.status != DockStatus.AVAILABLE:
        raise DockReservationError(
            f'Dock {dock.dock_number} is not available. Current status: {dock.get_status_display()}.'
        )

    # If the shipment already has an active reservation, release it first
    existing_reservation = DockReservation.objects.filter(
        shipment=shipment,
        reservation_status=ReservationStatus.ACTIVE,
    ).select_related('dock').first()

    if existing_reservation:
        if existing_reservation.dock == dock:
            # Already reserved this exact dock
            return shipment, existing_reservation
        # Release the old dock
        release_dock(shipment, performed_by, ip_address)

    # Validation: no active reservation for this dock
    active_reservations = DockReservation.objects.filter(
        dock=dock,
        reservation_status=ReservationStatus.ACTIVE,
    )
    if active_reservations.exists():
        raise DockReservationError(
            f'Dock {dock.dock_number} already has an active reservation.'
        )

    previous_status = shipment.status

    # Transition is not needed here; reserving a dock doesn't change the overall shipment status
    # (The shipment could be in IN_TRANSIT, APPROACHING_DESTINATION, etc)

    # Reserve the dock
    dock.status = DockStatus.RESERVED
    dock.save(update_fields=['status', 'updated_at'])

    # Create reservation record
    reservation = DockReservation.objects.create(
        shipment=shipment,
        dock=dock,
        reserved_by=performed_by,
        reservation_status=ReservationStatus.ACTIVE,
    )

    # Timeline event
    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.DOCK_RESERVED,
        description=f'Dock {dock.dock_number} at {dock.warehouse.name} reserved.',
        performed_by=performed_by,
        metadata={
            'dock_id': dock.id,
            'dock_number': dock.dock_number,
            'reservation_id': reservation.id,
        },
    )

    # Notify warehouse managers
    notify_warehouse_managers(
        organization=dock.warehouse.organization,
        title='Dock Reserved',
        message=f'Dock {dock.dock_number} reserved for shipment {shipment.shipment_number}.',
        notification_type=NotificationType.DOCK,
        shipment=shipment,
    )

    # Notify factory managers
    notify_factory_managers(
        organization=shipment.factory.organization,
        title='Dock Reserved',
        message=f'Dock reserved at {dock.warehouse.name} for shipment {shipment.shipment_number}.',
        notification_type=NotificationType.DOCK,
        shipment=shipment,
    )

    # Audit
    log_action(
        actor=performed_by,
        action=AuditAction.DOCK_RESERVED,
        resource_type='DockReservation',
        resource_id=reservation.id,
        previous_state={'dock_status': DockStatus.AVAILABLE, 'shipment_status': previous_status},
        new_state={'dock_status': DockStatus.RESERVED, 'shipment_status': shipment.status},
        ip_address=ip_address,
    )

    # Broadcast websocket update so driver apps immediately see the newly assigned dock
    try:
        broadcast_shipment_update(shipment.factory.organization_id, ShipmentSerializer(shipment).data)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to broadcast shipment update: {e}")

    return shipment, reservation


def release_dock(shipment, performed_by, ip_address=None):
    """Release the reserved dock for a shipment."""
    reservations = DockReservation.objects.filter(
        shipment=shipment,
        reservation_status=ReservationStatus.ACTIVE,
    ).select_related('dock')

    if not reservations.exists():
        raise DockReservationError('No active dock reservation found for this shipment.')

    previous_status = shipment.status

    for reservation in reservations:
        # Release dock
        dock = reservation.dock
        dock.status = DockStatus.AVAILABLE
        dock.save(update_fields=['status', 'updated_at'])

        # Cancel reservation
        reservation.reservation_status = ReservationStatus.CANCELLED
        reservation.save(update_fields=['reservation_status', 'updated_at'])

        log_action(
            actor=performed_by,
            action=AuditAction.DOCK_RELEASED,
            resource_type='DockReservation',
            resource_id=reservation.id,
            previous_state={'status': previous_status},
            new_state={'status': shipment.status},
            ip_address=ip_address,
        )

    # Broadcast websocket update
    try:
        broadcast_shipment_update(shipment.factory.organization_id, ShipmentSerializer(shipment).data)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to broadcast shipment update: {e}")

    return shipment
