"""
Arrival & Completion Service — handles arrival, dock assignment, unloading, and completion.
"""
from django.utils import timezone
from common.enums import (
    ShipmentStatus, ShipmentEventType, DockStatus,
    TruckStatus, ReservationStatus,
    NotificationType, AuditAction,
)
from operations.models import ShipmentEvent, DockReservation
from operations.services.state_machine import transition_shipment
from notifications.services import (
    notify_warehouse_managers, notify_factory_managers, notify_driver,
)
from audit.services import log_action


class ArrivalError(Exception):
    pass


def mark_arrived(shipment, performed_by, ip_address=None):
    """
    Mark a shipment as arrived at the destination warehouse.
    Typically called by the driver.
    """
    previous_status = shipment.status

    transition_shipment(shipment, ShipmentStatus.ARRIVED_AT_GATE)

    shipment.actual_arrival_time = timezone.now()
    shipment.save(update_fields=['actual_arrival_time', 'updated_at'])

    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.ARRIVED,
        description=f'Truck arrived at {shipment.destination_warehouse.name}.',
        performed_by=performed_by,
        metadata={'arrival_time': shipment.actual_arrival_time.isoformat()},
    )

    # Notify warehouse
    notify_warehouse_managers(
        organization=shipment.destination_warehouse.organization,
        title='Truck Arrived',
        message=f'Shipment {shipment.shipment_number} has arrived at {shipment.destination_warehouse.name}.',
        notification_type=NotificationType.SHIPMENT,
        shipment=shipment,
    )

    notify_factory_managers(
        organization=shipment.factory.organization,
        title='Shipment Arrived',
        message=f'Shipment {shipment.shipment_number} has arrived at destination.',
        notification_type=NotificationType.SHIPMENT,
        shipment=shipment,
    )

    log_action(
        actor=performed_by,
        action=AuditAction.SHIPMENT_ARRIVED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status},
        new_state={'status': shipment.status},
        ip_address=ip_address,
    )

    # Check if a dock reservation exists and auto-transition
    active_reservation = DockReservation.objects.filter(
        shipment=shipment,
        reservation_status=ReservationStatus.ACTIVE,
    ).first()

    if active_reservation:
        # Update dock status to OCCUPIED
        active_reservation.check_in_time = timezone.now()
        active_reservation.save(update_fields=['check_in_time', 'updated_at'])

        dock = active_reservation.dock
        dock.status = DockStatus.OCCUPIED
        dock.save(update_fields=['status', 'updated_at'])

        ShipmentEvent.objects.create(
            shipment=shipment,
            event_type=ShipmentEventType.DOCK_ENTERED,
            description=f'Truck checked into Dock {dock.dock_number}.',
            performed_by=performed_by,
            metadata={'dock_id': dock.id, 'dock_number': dock.dock_number},
        )

    return shipment


def start_unloading(shipment, performed_by, ip_address=None):
    """Start the unloading process at the assigned dock."""
    previous_status = shipment.status

    transition_shipment(shipment, ShipmentStatus.RECEIVING_IN_PROGRESS)

    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.UNLOADING_STARTED,
        description='Unloading started.',
        performed_by=performed_by,
    )

    notify_factory_managers(
        organization=shipment.factory.organization,
        title='Unloading Started',
        message=f'Shipment {shipment.shipment_number} is being unloaded at {shipment.destination_warehouse.name}.',
        notification_type=NotificationType.SHIPMENT,
        shipment=shipment,
    )

    log_action(
        actor=performed_by,
        action=AuditAction.UNLOADING_STARTED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status},
        new_state={'status': shipment.status},
        ip_address=ip_address,
    )

    return shipment


def complete_shipment(shipment, performed_by, ip_address=None):
    """
    Mark a shipment as completed.
    Releases the dock, truck, and driver.
    """
    previous_status = shipment.status

    transition_shipment(shipment, ShipmentStatus.COMPLETED)

    # Release dock reservation
    reservation = DockReservation.objects.filter(
        shipment=shipment,
        reservation_status=ReservationStatus.ACTIVE,
    ).select_related('dock').first()

    if reservation:
        reservation.reservation_status = ReservationStatus.COMPLETED
        reservation.check_out_time = timezone.now()
        reservation.save(update_fields=['reservation_status', 'check_out_time', 'updated_at'])

        dock = reservation.dock
        dock.status = DockStatus.AVAILABLE
        dock.save(update_fields=['status', 'updated_at'])

    # Release truck
    truck = shipment.assigned_truck
    if truck:
        truck.status = TruckStatus.AVAILABLE
        truck.save(update_fields=['status', 'updated_at'])

    # Release driver
    driver = shipment.assigned_driver
    if driver:
        driver.is_available = True
        driver.save(update_fields=['is_available', 'updated_at'])

    # Timeline
    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.SHIPMENT_COMPLETED,
        description='Shipment completed. Dock, truck, and driver released.',
        performed_by=performed_by,
    )

    # Notify all
    notify_factory_managers(
        organization=shipment.factory.organization,
        title='Shipment Completed',
        message=f'Shipment {shipment.shipment_number} has been completed.',
        notification_type=NotificationType.SHIPMENT,
        shipment=shipment,
    )

    if driver:
        notify_driver(
            driver=driver,
            title='Delivery Complete',
            message=f'Shipment {shipment.shipment_number} completed. You are now available for new assignments.',
            notification_type=NotificationType.SHIPMENT,
            shipment=shipment,
        )

    # Audit
    log_action(
        actor=performed_by,
        action=AuditAction.SHIPMENT_COMPLETED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status},
        new_state={'status': shipment.status},
        ip_address=ip_address,
    )

    return shipment


def cancel_shipment(shipment, performed_by, reason='', ip_address=None):
    """
    Cancel a shipment. Releases all assigned resources.
    """
    previous_status = shipment.status

    transition_shipment(shipment, ShipmentStatus.CANCELLED)

    # Release dock
    reservations = DockReservation.objects.filter(
        shipment=shipment,
        reservation_status=ReservationStatus.ACTIVE,
    ).select_related('dock')
    for reservation in reservations:
        reservation.reservation_status = ReservationStatus.CANCELLED
        reservation.save(update_fields=['reservation_status', 'updated_at'])
        reservation.dock.status = DockStatus.AVAILABLE
        reservation.dock.save(update_fields=['status', 'updated_at'])

    # Release truck
    truck = shipment.assigned_truck
    if truck:
        truck.status = TruckStatus.AVAILABLE
        truck.save(update_fields=['status', 'updated_at'])

    # Release driver
    driver = shipment.assigned_driver
    if driver:
        driver.is_available = True
        driver.save(update_fields=['is_available', 'updated_at'])

    # Timeline
    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.CANCELLED,
        description=f'Shipment cancelled. Reason: {reason or "Not specified"}.',
        performed_by=performed_by,
        metadata={'reason': reason},
    )

    # Audit
    log_action(
        actor=performed_by,
        action=AuditAction.SHIPMENT_CANCELLED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status},
        new_state={'status': shipment.status},
        ip_address=ip_address,
        metadata={'reason': reason},
    )

    return shipment
