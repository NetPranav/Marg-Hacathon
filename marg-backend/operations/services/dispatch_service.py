"""
Dispatch Service — handles the shipment dispatch workflow.
"""
from django.utils import timezone
from common.enums import (
    ShipmentStatus, ShipmentEventType,
    NotificationType, AuditAction,
)
from operations.models import ShipmentEvent
from operations.services.state_machine import transition_shipment
from notifications.services import (
    notify_factory_managers, notify_warehouse_managers, notify_driver,
)
from audit.services import log_action


class DispatchError(Exception):
    pass


def ready_for_dispatch(shipment, performed_by, ip_address=None):
    """
    Mark a shipment as ready for dispatch.
    Called after truck, driver, and dock are all assigned.
    """
    previous_status = shipment.status

    if shipment.status == ShipmentStatus.DRIVER_ASSIGNED:
        transition_shipment(shipment, ShipmentStatus.READY_FOR_PICKUP)

    transition_shipment(shipment, ShipmentStatus.LOADING_IN_PROGRESS)

    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.STATUS_CHANGED,
        description='Shipment marked as ready for dispatch.',
        performed_by=performed_by,
    )

    log_action(
        actor=performed_by,
        action=AuditAction.SHIPMENT_UPDATED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status},
        new_state={'status': shipment.status},
        ip_address=ip_address,
    )

    return shipment


def dispatch_shipment(shipment, performed_by, ip_address=None):
    """
    Dispatch a shipment.

    Preconditions:
    - Truck must be assigned.
    - Driver must be assigned.
    - Dock must be reserved.
    - Shipment must be in READY_FOR_DISPATCH status.
    """
    # Precondition checks
    if not shipment.assigned_truck:
        raise DispatchError('Cannot dispatch: no truck assigned.')
    if not shipment.assigned_driver:
        raise DispatchError('Cannot dispatch: no driver assigned.')

    previous_status = shipment.status

    # Transition to READY_FOR_TRANSIT (Handoff to Driver)
    transition_shipment(shipment, ShipmentStatus.READY_FOR_TRANSIT)

    # Timeline
    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.DISPATCHED,
        description=f'Loading completed and shipment marked ready for transit. Truck: {shipment.assigned_truck.registration_number}, Driver: {shipment.assigned_driver.user.full_name}.',
        performed_by=performed_by,
        metadata={
            'loading_complete_time': timezone.now().isoformat(),
            'truck': shipment.assigned_truck.registration_number,
            'driver': shipment.assigned_driver.user.full_name,
        },
    )

    # Notify all parties
    notify_factory_managers(
        organization=shipment.factory.organization,
        title='Shipment Dispatched',
        message=f'Shipment {shipment.shipment_number} has been dispatched from {shipment.factory.name}.',
        notification_type=NotificationType.SHIPMENT,
        shipment=shipment,
    )

    notify_warehouse_managers(
        organization=shipment.destination_warehouse.organization,
        title='Incoming Shipment Dispatched',
        message=f'Shipment {shipment.shipment_number} is en route to {shipment.destination_warehouse.name}.',
        notification_type=NotificationType.SHIPMENT,
        shipment=shipment,
    )

    notify_driver(
        driver=shipment.assigned_driver,
        title='Dispatch Confirmed',
        message=f'Shipment {shipment.shipment_number} dispatched. Navigate to {shipment.destination_warehouse.name}.',
        notification_type=NotificationType.SHIPMENT,
        shipment=shipment,
    )

    # Audit
    log_action(
        actor=performed_by,
        action=AuditAction.DISPATCH_APPROVED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status},
        new_state={'status': shipment.status},
        ip_address=ip_address,
    )

    return shipment
