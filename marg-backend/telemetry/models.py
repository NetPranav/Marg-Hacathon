from django.db import models
from django.conf import settings
from common.models import TimestampMixin


class TelemetryPoint(models.Model):
    """
    A single GPS telemetry data point from a driver's smartphone.
    Ingested every ~60 seconds during active transit.
    """
    driver = models.ForeignKey(
        'fleet.Driver',
        on_delete=models.CASCADE,
        related_name='telemetry_points',
    )
    truck = models.ForeignKey(
        'fleet.Truck',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='telemetry_points',
    )
    shipment = models.ForeignKey(
        'shipments.Shipment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='telemetry_points',
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    speed = models.DecimalField(
        max_digits=6, decimal_places=2, default=0,
        help_text='Speed in km/h',
    )
    heading = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text='Compass heading in degrees (0-360)',
    )
    battery_level = models.PositiveSmallIntegerField(
        default=100,
        help_text='Device battery percentage (0-100)',
    )
    recorded_at = models.DateTimeField(
        help_text='Timestamp from the device when this reading was taken',
    )

    class Meta:
        ordering = ['-recorded_at']
        verbose_name = 'Telemetry Point'
        verbose_name_plural = 'Telemetry Points'
        indexes = [
            models.Index(fields=['driver', '-recorded_at']),
            models.Index(fields=['truck', '-recorded_at']),
            models.Index(fields=['shipment', '-recorded_at']),
            models.Index(fields=['-recorded_at']),
        ]

    def __str__(self):
        return f"{self.driver} @ ({self.latitude}, {self.longitude}) — {self.recorded_at}"
