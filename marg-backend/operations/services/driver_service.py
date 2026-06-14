"""
Driver Assignment Service — handles assigning and unassigning drivers to shipments.
"""
from django.utils import timezone
from common.enums import (
    ShipmentStatus, ShipmentEventType,
    NotificationType, AuditAction,
)
from operations.models import ShipmentEvent
from operations.services.state_machine import transition_shipment
from notifications.services import notify_driver, notify_factory_managers
from audit.services import log_action


class DriverAssignmentError(Exception):
    pass


def assign_driver(shipment, driver, performed_by, ip_address=None):
    """
    Assign a driver to a shipment.

    Validations:
    - Driver must belong to the same organization as the factory.
    - Driver must be available.
    - Driver license must not be expired.
    - Shipment must be in TRUCK_ASSIGNED status.
    """
    # Validation: same organization or logistics provider
    if driver.organization != shipment.factory.organization and driver.organization != shipment.logistics_provider:
        raise DriverAssignmentError(
            'Driver does not belong to the factory or the assigned logistics provider.'
        )

    # Validation: driver availability
    if not driver.is_available:
        raise DriverAssignmentError(
            f'Driver {driver.user.full_name} is not available.'
        )

    # Validation: license validity
    if driver.license_expiry and driver.license_expiry < timezone.now().date():
        raise DriverAssignmentError(
            f'Driver {driver.user.full_name} has an expired license (expired {driver.license_expiry}).'
        )

    previous_status = shipment.status

    # Transition status
    transition_shipment(shipment, ShipmentStatus.DRIVER_ASSIGNED)

    # Update shipment
    shipment.assigned_driver = driver
    shipment.save(update_fields=['assigned_driver', 'updated_at'])

    # Update driver availability
    driver.is_available = False
    driver.save(update_fields=['is_available', 'updated_at'])

    # Timeline event
    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.DRIVER_ASSIGNED,
        description=f'Driver {driver.user.full_name} assigned.',
        performed_by=performed_by,
        metadata={'driver_id': driver.id, 'driver_name': driver.user.full_name},
    )

    # Notify the driver
    notify_driver(
        driver=driver,
        title='New Shipment Assignment',
        message=f'You have been assigned to shipment {shipment.shipment_number}. Pickup from {shipment.factory.name}.',
        notification_type=NotificationType.ASSIGNMENT,
        shipment=shipment,
    )

    # Notify factory managers
    notify_factory_managers(
        organization=shipment.factory.organization,
        title='Driver Assigned',
        message=f'Driver {driver.user.full_name} assigned to shipment {shipment.shipment_number}.',
        notification_type=NotificationType.ASSIGNMENT,
        shipment=shipment,
    )

    # Audit
    log_action(
        actor=performed_by,
        action=AuditAction.DRIVER_ASSIGNED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status, 'assigned_driver': None},
        new_state={'status': shipment.status, 'assigned_driver': driver.id},
        ip_address=ip_address,
    )

    return shipment


def unassign_driver(shipment, performed_by, ip_address=None):
    """Remove the assigned driver from a shipment."""
    driver = shipment.assigned_driver
    if not driver:
        raise DriverAssignmentError('No driver is assigned to this shipment.')

    previous_status = shipment.status

    # Transition back
    transition_shipment(shipment, ShipmentStatus.LOGISTICS_SELECTED)

    # Release driver
    driver.is_available = True
    driver.save(update_fields=['is_available', 'updated_at'])

    shipment.assigned_driver = None
    shipment.save(update_fields=['assigned_driver', 'updated_at'])

    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.DRIVER_UNASSIGNED,
        description=f'Driver {driver.user.full_name} unassigned.',
        performed_by=performed_by,
        metadata={'driver_id': driver.id},
    )

    log_action(
        actor=performed_by,
        action=AuditAction.DRIVER_UNASSIGNED,
        resource_type='Shipment',
        resource_id=shipment.id,
        previous_state={'status': previous_status, 'assigned_driver': driver.id},
        new_state={'status': shipment.status, 'assigned_driver': None},
        ip_address=ip_address,
    )

    return shipment
