import uuid
from django.db import models
from django.conf import settings
from common.models import TimestampMixin
from common.enums import ShipmentType, ShipmentPriority, ShipmentStatus, ParcelPriority, LotStatus


def generate_shipment_number():
    """Generate a unique shipment number: SHP-XXXXXXXX."""
    return f"SHP-{uuid.uuid4().hex[:8].upper()}"


def generate_lot_number():
    """Generate a unique lot number: LOT-XXXXXXXX."""
    return f"LOT-{uuid.uuid4().hex[:8].upper()}"


class Lot(TimestampMixin, models.Model):
    """
    A batch of parcels created by the factory, intended for a specific destination.
    Can be negotiated with logistics companies before generating a shipment.
    """
    lot_number = models.CharField(
        max_length=20, unique=True, default=generate_lot_number, editable=False,
    )
    factory = models.ForeignKey(
        'factories.Factory', on_delete=models.CASCADE, related_name='lots'
    )
    destination_warehouse = models.ForeignKey(
        'warehouses.Warehouse', on_delete=models.CASCADE, related_name='incoming_lots'
    )
    status = models.CharField(
        max_length=50, choices=LotStatus.choices, default=LotStatus.DRAFT
    )
    assigned_logistics_company = models.ForeignKey(
        'logistics.LogisticsCompany', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_lots'
    )
    expected_dispatch_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.lot_number} ({self.get_status_display()})"


class LotParcel(TimestampMixin, models.Model):
    """
    An individual parcel or item within a Lot.
    """
    lot = models.ForeignKey(Lot, on_delete=models.CASCADE, related_name='parcels')
    parcel_id = models.CharField(max_length=50) # Factory's internal ID
    
    # Dimensions (cm) and Weight (kg)
    length = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    width = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    height = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    weight = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField(default=1)
    
    dispatch_priority = models.CharField(
        max_length=10, choices=ParcelPriority.choices, default=ParcelPriority.MEDIUM
    )
    
    # Optional Fields
    product_name = models.CharField(max_length=255, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    batch_number = models.CharField(max_length=100, blank=True)
    is_fragile = models.BooleanField(default=False)
    temperature_requirement = models.CharField(max_length=100, blank=True) # e.g. "-20C to -10C"
    insurance_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Parcel {self.parcel_id} of {self.lot.lot_number}"


class Shipment(TimestampMixin, models.Model):
    """
    A shipment moving goods from a factory to a warehouse.
    Central entity connecting factories, warehouses, trucks, and drivers.
    """
    shipment_number = models.CharField(
        max_length=20, unique=True, default=generate_shipment_number, editable=False,
    )

    # Origin & Destination
    factory = models.ForeignKey(
        'factories.Factory',
        on_delete=models.CASCADE,
        related_name='shipments',
    )
    destination_warehouse = models.ForeignKey(
        'warehouses.Warehouse',
        on_delete=models.CASCADE,
        related_name='incoming_shipments',
    )
    lot = models.ForeignKey(
        Lot,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='shipments',
        help_text="The negotiated lot from which this shipment was generated"
    )

    # Assigned fleet
    assigned_truck = models.ForeignKey(
        'fleet.Truck',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='shipments',
    )
    assigned_driver = models.ForeignKey(
        'fleet.Driver',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='shipments',
    )

    # Classification
    shipment_type = models.CharField(
        max_length=20,
        choices=ShipmentType.choices,
        default=ShipmentType.FINISHED_GOODS,
    )
    priority = models.CharField(
        max_length=10,
        choices=ShipmentPriority.choices,
        default=ShipmentPriority.MEDIUM,
    )
    status = models.CharField(
        max_length=25,
        choices=ShipmentStatus.choices,
        default=ShipmentStatus.DRAFT,
    )

    # Time tracking
    expected_dispatch_time = models.DateTimeField(null=True, blank=True)
    expected_arrival_time = models.DateTimeField(null=True, blank=True)
    actual_dispatch_time = models.DateTimeField(null=True, blank=True)
    actual_arrival_time = models.DateTimeField(null=True, blank=True)

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_shipments',
    )

    # Enterprise Platform — Extended shipment context
    logistics_provider = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='handled_shipments',
        help_text='The logistics company handling this shipment',
    )
    total_distance_km = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text='Total route distance in km',
    )
    estimated_revenue = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text='Estimated revenue for the shipment',
    )
    pod_submitted = models.BooleanField(
        default=False,
        help_text='Whether proof of delivery has been submitted',
    )
    is_verified = models.BooleanField(
        default=False,
        help_text='Whether loading has been verified by employee',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Shipment'
        verbose_name_plural = 'Shipments'

    def __str__(self):
        return f"{self.shipment_number} ({self.get_status_display()})"
