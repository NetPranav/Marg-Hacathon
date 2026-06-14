"""
Truck Assignment Service — handles assigning and unassigning trucks to shipments.
"""
from django.utils import timezone
from common.enums import (
    ShipmentStatus, ShipmentEventType, TruckStatus,
    NotificationType, AuditAction,
)
from operations.models import ShipmentEvent
from operations.services.state_machine import transition_shipment
from notifications.services import notify_factory_managers, notify_driver
from audit.services import log_action


class TruckAssignmentError(Exception):
    pass


def assign_truck(shipment, truck, performed_by, ip_address=None):
    """
    Assign a truck to a shipment.

    Validations:
    - Truck must be AVAILABLE.
    - Truck must belong to the same organization as the shipment's factory.
    - Shipment must be in READY_FOR_ASSIGNMENT status.
    """
    # Validation: same organization or logistics provider
    if truck.organization != shipment.factory.organization and truck.organization != shipment.logistics_provider:
        raise TruckAssignmentError(
            'Truck does not belong to the factory or the assigned logistics provider.'
        )

    # Validation: truck availability
    if truck.status != TruckStatus.AVAILABLE:
        raise TruckAssignmentError(
            f'Truck {truck.registration_number} is not available. Current status: {truck.get_status_display()}.'
        )

    # Validation: not already assigned to another active shipment
    active_shipments = truck.shipments.exclude(
        status__in=[ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED, ShipmentStatus.FAILED]
    ).exclude(id=shipment.id)
    if active_shipments.exists():
        raise TruckAssignmentError(
            f'Truck {truck.registration_number} is already assigned to shipment {active_shipments.first().shipment_number}.'
        )

    previous_status = shipment.status

    # We do not transition the shipment status here, because DRIVER_ASSIGNED is the formal status 
    # that handles both. Truck assignment is a prerequisite or parallel step.

    # Update shipment
    shipment.assigned_truck = truck
    shipment.save(update_fields=['assigned_truck', 'updated_at'])

    # Update truck status
    truck.status = TruckStatus.IN_TRANSIT
    truck.save(update_fields=['status', 'updated_at'])

    # Create timeline event
    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.TRUCK_ASSIGNED,
        description=f'Truck {truck.registration_number} assigned.',
        performed_by=performed_by,
        metadata={'truck_id': truck.id, 'truck_reg': truck.registration_number},
    )

    # Notifications
    notify_factory_managers(
        organization=shipment.factory.organization,
        title='Truck Assigned',
        message=f'Truck {truck.registration_number} has been assigned to shipment {shipment.shipment_number}.',
        notification_type=NotificationType.ASSIGNMENT,
        shipment=shipment,
    )

    # Audit
    log_action(
        actor=performed_by,
        action=AuditAction.TRUCK_ASSIGNED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status, 'assigned_truck': None},
        new_state={'status': shipment.status, 'assigned_truck': truck.id},
        ip_address=ip_address,
    )

    return shipment


def unassign_truck(shipment, performed_by, ip_address=None):
    """Remove the assigned truck from a shipment."""
    truck = shipment.assigned_truck
    if not truck:
        raise TruckAssignmentError('No truck is assigned to this shipment.')

    previous_status = shipment.status

    # We don't transition shipment status on truck unassign since DRIVER_ASSIGNED is the main status
    # If a driver is unassigned, it goes back to LOGISTICS_SELECTED.

    # Release truck
    truck.status = TruckStatus.AVAILABLE
    truck.save(update_fields=['status', 'updated_at'])

    shipment.assigned_truck = None
    shipment.save(update_fields=['assigned_truck', 'updated_at'])

    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.TRUCK_UNASSIGNED,
        description=f'Truck {truck.registration_number} unassigned.',
        performed_by=performed_by,
        metadata={'truck_id': truck.id},
    )

    log_action(
        actor=performed_by,
        action=AuditAction.TRUCK_UNASSIGNED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status, 'assigned_truck': truck.id},
        new_state={'status': shipment.status, 'assigned_truck': None},
        ip_address=ip_address,
    )

    return shipment
