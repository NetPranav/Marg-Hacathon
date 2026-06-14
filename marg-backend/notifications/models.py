from django.db import models
from django.conf import settings
from common.enums import NotificationType


class Notification(models.Model):
    """
    In-app notification for platform users.
    Generated automatically by lifecycle events.
    """
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=15,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    is_read = models.BooleanField(default=False)
    related_shipment = models.ForeignKey(
        'shipments.Shipment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='notifications',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        status = '📖' if self.is_read else '🔔'
        return f"{status} {self.title} → {self.recipient.email}"
