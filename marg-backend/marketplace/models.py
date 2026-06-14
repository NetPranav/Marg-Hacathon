from django.db import models
from django.conf import settings
from common.models import TimestampMixin
from common.enums import MarketplaceLoadStatus, MarketplaceLoadType


class MarketplaceLoad(TimestampMixin, models.Model):
    """
    A load available on the freight marketplace.
    Can be from tie-up factories or open market.
    Only ADMIN/SUPER_ADMIN users can browse and accept loads.
    """
    # Link to shipment (created when load is accepted)
    shipment = models.OneToOneField(
        'shipments.Shipment',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='marketplace_load',
    )

    # Load details
    title = models.CharField(max_length=255)
    origin_name = models.CharField(max_length=255)
    destination_name = models.CharField(max_length=255)
    origin_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    origin_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    dest_lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    dest_lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    cargo_type = models.CharField(max_length=100)
    weight_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rate_per_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    estimated_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Classification
    load_type = models.CharField(
        max_length=20,
        choices=MarketplaceLoadType.choices,
        default=MarketplaceLoadType.OPEN_MARKET,
    )
    status = models.CharField(
        max_length=20,
        choices=MarketplaceLoadStatus.choices,
        default=MarketplaceLoadStatus.AVAILABLE,
    )
    vehicle_type_required = models.CharField(max_length=50, blank=True, default='')

    # Locking
    locked_by = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='locked_loads',
    )
    locked_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    # Posted by (factory/company that posted the load)
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='posted_loads',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Marketplace Load'
        verbose_name_plural = 'Marketplace Loads'
        indexes = [
            models.Index(fields=['status', 'load_type']),
        ]

    def __str__(self):
        return f"{self.title} — {self.origin_name} → {self.destination_name}"


class MarketplaceBid(TimestampMixin, models.Model):
    """
    A bid placed on a marketplace load by a logistics company.
    """
    load = models.ForeignKey(
        MarketplaceLoad,
        on_delete=models.CASCADE,
        related_name='bids',
    )
    bidder = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='marketplace_bids',
    )
    bid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='placed_bids',
    )
    bid_amount = models.DecimalField(max_digits=12, decimal_places=2)
    notes = models.TextField(blank=True, default='')
    is_accepted = models.BooleanField(default=False)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Marketplace Bid'
        verbose_name_plural = 'Marketplace Bids'

    def __str__(self):
        return f"Bid ₹{self.bid_amount} by {self.bidder.name} on {self.load.title}"
