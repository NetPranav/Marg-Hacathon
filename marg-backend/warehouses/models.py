from django.db import models
from common.models import TimestampMixin, AddressMixin
from common.enums import DockStatus, DockType, ParcelStatus, ParcelPriority, WarehouseType


class Warehouse(TimestampMixin, AddressMixin, models.Model):
    """
    A warehouse/distribution center belonging to an organization.
    This is where shipments are received and stored.
    """
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='warehouses',
    )
    name = models.CharField(max_length=255)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
    )
    capacity = models.PositiveIntegerField(
        default=0,
        help_text='Total storage capacity in square meters.',
    )
    warehouse_type = models.CharField(
        max_length=50,
        choices=WarehouseType.choices,
        default=WarehouseType.DESTINATION_WAREHOUSE,
    )
    operating_hours = models.CharField(max_length=255, blank=True, default='24/7')
    special_handling = models.JSONField(
        default=list, blank=True,
        help_text='List of capabilities like "Temperature Controlled", "Hazardous Goods"'
    )
    max_concurrent_trucks = models.PositiveIntegerField(default=5)

    # Layout Dimensions
    layout_width = models.FloatField(default=50.0)
    layout_depth = models.FloatField(default=30.0)
    layout_height = models.FloatField(default=6.0)

    # ─── Phase 7: Warehouse dimensions for 3D layout ────────────────────────
    width = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text='Warehouse width in meters.',
    )
    depth = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text='Warehouse depth in meters.',
    )
    height = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text='Warehouse wall height in meters.',
    )
    layout_version = models.PositiveIntegerField(
        default=1,
        help_text='Version number for layout tracking.',
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Warehouse'
        verbose_name_plural = 'Warehouses'

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

    @property
    def occupied_slots(self):
        """Total occupied volume or slots in the warehouse."""
        return sum(shelf.occupied_volume for rack in self.racks.all() for shelf in rack.shelves.all())

    @property
    def available_slots(self):
        """Total available volume or slots in the warehouse."""
        return sum(shelf.available_volume for rack in self.racks.all() for shelf in rack.shelves.all())

    @property
    def reserved_capacity(self):
        """Total capacity reserved for incoming shipments."""
        from django.db.models import Sum
        reserved_volume = self.parcels.filter(status=ParcelStatus.PENDING).aggregate(
            total=Sum(models.F('height') * models.F('width') * models.F('depth'))
        )['total']
        return float(reserved_volume or 0)

    @property
    def forwarding_capacity(self):
        """Total capacity planned for forwarding (dispatching)."""
        from django.db.models import Sum
        forwarding_volume = self.parcels.filter(status=ParcelStatus.DISPATCHED).aggregate(
            total=Sum(models.F('height') * models.F('width') * models.F('depth'))
        )['total']
        return float(forwarding_volume or 0)


class DockBay(TimestampMixin, models.Model):
    """
    A loading/unloading dock bay within a warehouse.
    Each warehouse can have multiple dock bays.
    Also serves as gate reference points for slotting optimization.
    """
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='dock_bays',
    )
    dock_number = models.CharField(max_length=20)
    status = models.CharField(
        max_length=20,
        choices=DockStatus.choices,
        default=DockStatus.AVAILABLE,
    )
    dock_type = models.CharField(
        max_length=20,
        choices=DockType.choices,
        default=DockType.BOTH,
    )
    x_position = models.FloatField(null=True, blank=True)
    z_position = models.FloatField(null=True, blank=True)

    # ─── Phase 7: World-space position for 3D rendering ─────────────────────
    x_position = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text='X coordinate in warehouse 3D space.',
    )
    z_position = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text='Z coordinate in warehouse 3D space.',
    )

    class Meta:
        ordering = ['dock_number']
        verbose_name = 'Dock Bay'
        verbose_name_plural = 'Dock Bays'
        unique_together = ('warehouse', 'dock_number')

    def __str__(self):
        return f"Dock {self.dock_number} @ {self.warehouse.name}"

# ─── Phase 7: Slotting Models ───────────────────────────────────────────────

class Rack(TimestampMixin, models.Model):
    """
    A storage rack within a warehouse.
    Contains multiple shelves for parcel storage.
    """
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='racks',
    )
    rack_id = models.CharField(
        max_length=50,
        help_text='Display ID, e.g. R-01',
    )
    row_index = models.PositiveIntegerField(default=0)
    col_index = models.PositiveIntegerField(default=0)

    # World-space position for 3D rendering
    x_position = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
    )
    z_position = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
    )

    num_shelves = models.PositiveIntegerField(default=4)
    shelf_width = models.DecimalField(
        max_digits=6, decimal_places=2, default=3.0,
        help_text='Width of each shelf in meters.',
    )
    shelf_depth = models.DecimalField(
        max_digits=6, decimal_places=2, default=1.5,
        help_text='Depth of each shelf in meters.',
    )
    shelf_height = models.DecimalField(
        max_digits=6, decimal_places=2, default=1.0,
        help_text='Height of each shelf in meters.',
    )

    class Meta:
        ordering = ['rack_id']
        verbose_name = 'Rack'
        verbose_name_plural = 'Racks'
        unique_together = ('warehouse', 'rack_id')

    def __str__(self):
        return f"Rack {self.rack_id} @ {self.warehouse.name}"

class Shelf(TimestampMixin, models.Model):
    """
    A single shelf within a rack.
    Stores parcels and tracks volume/weight.
    """
    rack = models.ForeignKey(
        Rack,
        on_delete=models.CASCADE,
        related_name='shelves',
    )
    level = models.PositiveIntegerField(
        help_text='Shelf level (1=bottom, N=top).',
    )
    available_volume = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text='Remaining volume in cubic meters.',
    )
    occupied_volume = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text='Used volume in cubic meters.',
    )
    max_weight = models.DecimalField(
        max_digits=8, decimal_places=2, default=500,
        help_text='Maximum weight capacity in kg.',
    )
    current_weight = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        help_text='Current weight on shelf in kg.',
    )
    is_locked = models.BooleanField(
        default=False,
        help_text='Locked by manager — no automatic placement.',
    )
    is_reserved = models.BooleanField(
        default=False,
        help_text='Reserved for specific incoming parcel.',
    )

    class Meta:
        ordering = ['rack', 'level']
        verbose_name = 'Shelf'
        verbose_name_plural = 'Shelves'
        unique_together = ('rack', 'level')

    def __str__(self):
        return f"Shelf L{self.level} on {self.rack}"

    @property
    def total_volume(self):
        """Total volume of this shelf in cubic meters."""
        r = self.rack
        return float(r.shelf_width * r.shelf_depth * r.shelf_height)

    @property
    def utilization(self):
        """Utilization ratio (0.0 to 1.0)."""
        total = self.total_volume
        if total == 0:
            return 0
        return min(float(self.occupied_volume) / total, 1.0)

    def save(self, *args, **kwargs):
        """Auto-compute available_volume on save."""
        total = self.total_volume
        self.available_volume = max(total - float(self.occupied_volume), 0)
        super().save(*args, **kwargs)


class Parcel(TimestampMixin, models.Model):
    """
    A parcel stored (or pending storage) within a warehouse.
    The slotting engine assigns parcels to optimal shelf positions.
    """
    parcel_id = models.CharField(
        max_length=50, unique=True,
        help_text='Unique parcel identifier, e.g. PKG-A4F2B1.',
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='parcels',
        null=True, blank=True
    )
    shelf = models.ForeignKey(
        Shelf,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='parcels',
        help_text='Assigned shelf (null if pending placement).',
    )

    # Dimensions
    height = models.DecimalField(max_digits=6, decimal_places=2, help_text='Height in meters.')
    width = models.DecimalField(max_digits=6, decimal_places=2, help_text='Width in meters.')
    depth = models.DecimalField(max_digits=6, decimal_places=2, help_text='Depth in meters.')
    weight = models.DecimalField(max_digits=8, decimal_places=2, help_text='Weight in kg.', default=0)

    # Added from burhan-backend
    color = models.CharField(max_length=7, default="#C28E5F")

    # Logistics
    destination = models.CharField(max_length=255, default="Unknown")
    expected_dispatch_date = models.DateField(null=True, blank=True)
    priority = models.CharField(
        max_length=20,
        choices=ParcelPriority.choices,
        default=ParcelPriority.MEDIUM,
    )
    special_handling = models.TextField(blank=True, default='')
    position_label = models.CharField(
        max_length=10, blank=True, default='',
        help_text='Compartment position on shelf, e.g. A2.',
    )
    status = models.CharField(
        max_length=20,
        choices=ParcelStatus.choices,
        default=ParcelStatus.PENDING,
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Parcel'
        verbose_name_plural = 'Parcels'

    def __str__(self):
        return f"{self.parcel_id} → {self.destination}"

    @property
    def volume(self):
        """Volume of this parcel in cubic meters."""
        return float(self.height * self.width * self.depth)
