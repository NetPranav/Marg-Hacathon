from django.db import models
from django.conf import settings
from common.models import TimestampMixin, AddressMixin


class Factory(TimestampMixin, AddressMixin, models.Model):
    """
    A manufacturing facility belonging to an organization.
    This is where shipments originate.
    """
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='factories',
    )
    name = models.CharField(max_length=255)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_factories',
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Factory'
        verbose_name_plural = 'Factories'

    def __str__(self):
        return f"{self.name} ({self.organization.name})"
