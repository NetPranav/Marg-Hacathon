from django.db import models
from django.conf import settings
from common.models import TimestampMixin
from common.enums import ShipmentEventType, ReservationStatus

class EmployeeProfile(TimestampMixin, models.Model):
    """
    Profile for an operations employee linked 1:1 to a User with role=EMPLOYEE.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='employees',
    )
    department = models.CharField(max_length=100, blank=True, default='OPERATIONS')
    operational_role = models.CharField(max_length=100, blank=True, default='STAFF')
    shift_type = models.CharField(max_length=50, blank=True, default='DAY')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Employee Profile'
        verbose_name_plural = 'Employee Profiles'

    def __str__(self):
        return f"{self.user.full_name} ({self.department})"
class ShipmentEvent(models.Model):
    """
    Immutable timeline record for a shipment's lifecycle.
    Every operation (assign, dispatch, arrive, etc.) creates one of these.
    """
    shipment = models.ForeignKey(
        'shipments.Shipment',
        on_delete=models.CASCADE,
        related_name='events',
    )
    event_type = models.CharField(
        max_length=25,
        choices=ShipmentEventType.choices,
    )
    description = models.TextField(blank=True, default='')
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='shipment_events',
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Shipment Event'
        verbose_name_plural = 'Shipment Events'

    def __str__(self):
        return f"{self.shipment.shipment_number} — {self.get_event_type_display()}"


class DockReservation(TimestampMixin, models.Model):
    """
    A reservation linking a shipment to a specific dock bay.
    Tracks check-in / check-out for SLA and detention calculations.
    """
    shipment = models.ForeignKey(
        'shipments.Shipment',
        on_delete=models.CASCADE,
        related_name='dock_reservations',
    )
    dock = models.ForeignKey(
        'warehouses.DockBay',
        on_delete=models.CASCADE,
        related_name='reservations',
    )
    reserved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='dock_reservations',
    )
    reserved_at = models.DateTimeField(auto_now_add=True)
    reservation_status = models.CharField(
        max_length=15,
        choices=ReservationStatus.choices,
        default=ReservationStatus.ACTIVE,
    )
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-reserved_at']
        verbose_name = 'Dock Reservation'
        verbose_name_plural = 'Dock Reservations'

    def __str__(self):
        return f"{self.shipment.shipment_number} → {self.dock}"


class GateCheckIn(TimestampMixin, models.Model):
    """
    Gate check-in record when a driver arrives at the warehouse.
    """
    class CheckInStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Verification'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    shipment = models.OneToOneField(
        'shipments.Shipment',
        on_delete=models.CASCADE,
        related_name='gate_check_in',
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='verified_check_ins',
    )
    status = models.CharField(
        max_length=20,
        choices=CheckInStatus.choices,
        default=CheckInStatus.PENDING,
    )
    truck_number = models.CharField(max_length=50, blank=True)
    driver_name = models.CharField(max_length=100, blank=True)
    seal_number = models.CharField(max_length=100, blank=True)
    documents_verified = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Gate Check-In'
        verbose_name_plural = 'Gate Check-Ins'

    def __str__(self):
        return f"Check-In for {self.shipment.shipment_number} ({self.status})"


class ExceptionReport(TimestampMixin, models.Model):
    """
    Exception raised during receiving or check-in.
    """
    class ExceptionType(models.TextChoices):
        MISSING_PARCEL = 'MISSING_PARCEL', 'Missing Parcel'
        DAMAGED_GOODS = 'DAMAGED_GOODS', 'Damaged Goods'
        WRONG_QUANTITY = 'WRONG_QUANTITY', 'Wrong Quantity'
        BROKEN_SEAL = 'BROKEN_SEAL', 'Broken Seal'
        INCORRECT_DOCS = 'INCORRECT_DOCS', 'Incorrect Documentation'
        OTHER = 'OTHER', 'Other'

    class ExceptionStatus(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        RESOLVING = 'RESOLVING', 'Resolving'
        RESOLVED = 'RESOLVED', 'Resolved'

    shipment = models.ForeignKey(
        'shipments.Shipment',
        on_delete=models.CASCADE,
        related_name='exception_reports',
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reported_exceptions',
    )
    exception_type = models.CharField(
        max_length=50,
        choices=ExceptionType.choices,
    )
    description = models.TextField()
    photo = models.ImageField(upload_to='exceptions/', null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=ExceptionStatus.choices,
        default=ExceptionStatus.OPEN,
    )
    resolution_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Exception Report'
        verbose_name_plural = 'Exception Reports'

    def __str__(self):
        return f"{self.get_exception_type_display()} on {self.shipment.shipment_number}"
