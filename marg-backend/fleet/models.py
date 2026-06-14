from django.db import models
from django.conf import settings
from common.models import TimestampMixin
from common.enums import TruckStatus


class Driver(TimestampMixin, models.Model):
    """
    Extended driver profile linked 1:1 to a User with role=DRIVER.
    Stores license, identity, and availability info.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='driver_profile',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='drivers',
    )
    license_number = models.CharField(max_length=50, unique=True)
    license_expiry = models.DateField(null=True, blank=True)
    aadhaar_number = models.CharField(
        max_length=12, blank=True, default='',
        help_text='12-digit Aadhaar number',
    )
    emergency_contact = models.CharField(max_length=15, blank=True, default='')
    is_available = models.BooleanField(default=True)

    # Enterprise Platform — Extended driver profile
    license_image = models.ImageField(
        upload_to='licenses/', blank=True, null=True,
        help_text='Scanned copy of driving license',
    )
    profile_photo = models.ImageField(
        upload_to='driver_photos/', blank=True, null=True,
        help_text='Driver profile photograph',
    )
    vahan_verified = models.BooleanField(
        default=False,
        help_text='Whether license has been verified via Vahan API',
    )
    rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=5.00,
        help_text='Driver performance rating (0-5)',
    )
    total_trips = models.PositiveIntegerField(
        default=0,
        help_text='Total completed trips',
    )
    total_distance_km = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text='Total distance driven in km',
    )
    fuel_efficiency_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=3.00,
        help_text='Fuel efficiency score (0-5)',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Driver'
        verbose_name_plural = 'Drivers'

    def __str__(self):
        return f"{self.user.full_name} ({self.license_number})"


class Truck(TimestampMixin, models.Model):
    """
    A truck/vehicle belonging to an organization's fleet.
    """
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='trucks',
    )
    registration_number = models.CharField(max_length=20, unique=True)
    vehicle_type = models.CharField(max_length=50, blank=True, default='')
    capacity_kg = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text='Maximum load capacity in kilograms',
    )
    volume_m3 = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        help_text='Cargo volume in cubic meters',
    )
    manufacturing_year = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=TruckStatus.choices,
        default=TruckStatus.AVAILABLE,
    )
    assigned_driver = models.OneToOneField(
        Driver,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_truck',
    )

    # Enterprise Platform — Live tracking fields
    current_latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text='Last known latitude',
    )
    current_longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text='Last known longitude',
    )
    last_telemetry_at = models.DateTimeField(
        null=True, blank=True,
        help_text='Timestamp of last telemetry update',
    )
    fuel_capacity_liters = models.DecimalField(
        max_digits=8, decimal_places=2, default=0,
        help_text='Fuel tank capacity in liters',
    )
    next_service_date = models.DateField(
        null=True, blank=True,
        help_text='Next scheduled maintenance date',
    )
    insurance_expiry_date = models.DateField(
        null=True, blank=True,
        help_text='Insurance policy expiry date',
    )
    fitness_cert_expiry_date = models.DateField(
        null=True, blank=True,
        help_text='Fitness certificate expiry date',
    )

    class Meta:
        ordering = ['registration_number']
        verbose_name = 'Truck'
        verbose_name_plural = 'Trucks'

    def __str__(self):
        return f"{self.registration_number} ({self.get_status_display()})"
