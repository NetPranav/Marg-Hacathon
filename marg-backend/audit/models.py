from django.db import models
from django.conf import settings
from common.enums import AuditAction


class AuditLog(models.Model):
    """
    Immutable audit record for all operational actions.
    Provides full traceability for SLA validation and compliance.
    """
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_logs',
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=30, choices=AuditAction.choices)
    resource_type = models.CharField(
        max_length=50,
        help_text='Model name, e.g. Shipment, Truck, DockReservation',
    )
    resource_id = models.PositiveIntegerField()
    previous_state = models.JSONField(default=dict, blank=True)
    new_state = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f"{self.get_action_display()} on {self.resource_type}#{self.resource_id} by {self.actor}"
