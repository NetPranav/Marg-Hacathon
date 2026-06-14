from django.db import models
from common.models import TimestampMixin


class Geofence(TimestampMixin, models.Model):
    """
    A circular geofence around a warehouse or factory.
    Used to trigger automatic events when trucks enter/exit.
    Uses Haversine distance — no PostGIS required.
    """
    name = models.CharField(max_length=255)
    warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='geofences',
    )
    factory = models.ForeignKey(
        'factories.Factory',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='geofences',
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    radius_km = models.DecimalField(
        max_digits=6, decimal_places=2, default=20.00,
        help_text='Geofence radius in kilometers',
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Geofence'
        verbose_name_plural = 'Geofences'

    def __str__(self):
        target = self.warehouse or self.factory
        return f"{self.name} ({self.radius_km}km around {target})"
