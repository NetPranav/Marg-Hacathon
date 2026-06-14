"""
Notification service — creates in-app notifications for lifecycle events.
"""
from django.contrib.auth import get_user_model
from common.enums import UserRole, NotificationType
from notifications.models import Notification

User = get_user_model()


def create_notification(recipient, title, message, notification_type, shipment=None):
    """Create a single notification for a user."""
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        related_shipment=shipment,
    )


def notify_factory_managers(organization, title, message, notification_type, shipment=None):
    """Broadcast a notification to all factory managers in an organization."""
    managers = User.objects.filter(
        organization=organization,
        role=UserRole.FACTORY_MANAGER,
        is_active=True,
    )
    notifications = [
        Notification(
            recipient=manager,
            title=title,
            message=message,
            notification_type=notification_type,
            related_shipment=shipment,
        )
        for manager in managers
    ]
    return Notification.objects.bulk_create(notifications)


def notify_warehouse_managers(organization, title, message, notification_type, shipment=None):
    """Broadcast a notification to all warehouse managers in an organization."""
    managers = User.objects.filter(
        organization=organization,
        role=UserRole.WAREHOUSE_MANAGER,
        is_active=True,
    )
    notifications = [
        Notification(
            recipient=manager,
            title=title,
            message=message,
            notification_type=notification_type,
            related_shipment=shipment,
        )
        for manager in managers
    ]
    return Notification.objects.bulk_create(notifications)


def notify_driver(driver, title, message, notification_type, shipment=None):
    """Send a direct notification to a driver."""
    return create_notification(
        recipient=driver.user,
        title=title,
        message=message,
        notification_type=notification_type,
        shipment=shipment,
    )
