from django.db import models
from django.conf import settings
from common.models import TimestampMixin
from common.enums import MilestoneType, DelayType


class Milestone(TimestampMixin, models.Model):
    """
    A trip milestone checkpoint. Milestones are sequential and
    confirmed by the driver via swipe-to-confirm interaction.
    """
    shipment = models.ForeignKey(
        'shipments.Shipment',
        on_delete=models.CASCADE,
        related_name='milestones',
    )
    milestone_type = models.CharField(
        max_length=30,
        choices=MilestoneType.choices,
    )
    sequence = models.PositiveSmallIntegerField(
        default=0,
        help_text='Order in which this milestone appears (0-based)',
    )
    is_confirmed = models.BooleanField(default=False)
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='confirmed_milestones',
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text='GPS latitude at confirmation',
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text='GPS longitude at confirmation',
    )
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['shipment', 'sequence']
        verbose_name = 'Milestone'
        verbose_name_plural = 'Milestones'
        unique_together = ('shipment', 'milestone_type')

    def __str__(self):
        status = '✅' if self.is_confirmed else '⬜'
        return f"{status} {self.get_milestone_type_display()} — {self.shipment.shipment_number}"


class DelayEvent(TimestampMixin, models.Model):
    """
    A delay reported by a driver during transit.
    Triggers ETA recalculation and admin/warehouse alerts.
    """
    shipment = models.ForeignKey(
        'shipments.Shipment',
        on_delete=models.CASCADE,
        related_name='delay_events',
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reported_delays',
    )
    delay_type = models.CharField(
        max_length=30,
        choices=DelayType.choices,
    )
    estimated_delay_minutes = models.PositiveIntegerField(
        help_text='Estimated delay in minutes',
    )
    description = models.TextField(
        blank=True, default='',
        help_text='Additional details about the delay',
    )
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
    )
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Delay Event'
        verbose_name_plural = 'Delay Events'

    def __str__(self):
        return (
            f"{self.get_delay_type_display()} — "
            f"{self.estimated_delay_minutes}min — "
            f"{self.shipment.shipment_number}"
        )
