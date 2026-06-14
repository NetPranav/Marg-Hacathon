from django.db import models
from django.conf import settings
from common.models import TimestampMixin


class ProofOfDelivery(TimestampMixin, models.Model):
    """
    Proof of Delivery for a shipment.
    Requires geofence validation, OTP verification, signature, and cargo images.
    PoD can only be submitted when the driver is within the assigned dock geofence.
    """
    shipment = models.OneToOneField(
        'shipments.Shipment',
        on_delete=models.CASCADE,
        related_name='proof_of_delivery',
    )
    delivered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='deliveries',
    )
    receiver_name = models.CharField(
        max_length=255,
        help_text='Name of the person receiving the delivery',
    )
    receiver_phone = models.CharField(
        max_length=15, blank=True, default='',
    )

    # OTP Verification
    otp_code = models.CharField(
        max_length=6,
        help_text='OTP sent to receiver for verification',
    )
    otp_verified = models.BooleanField(default=False)
    otp_verified_at = models.DateTimeField(null=True, blank=True)

    # Signature
    signature_image = models.ImageField(
        upload_to='pod_signatures/',
        blank=True, null=True,
        help_text='Digital signature of the receiver',
    )

    # Cargo Images
    cargo_images = models.JSONField(
        default=list,
        help_text='List of image paths for cargo photographs',
    )

    # Geofence Validation
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text='GPS latitude at PoD submission',
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True,
        help_text='GPS longitude at PoD submission',
    )
    geofence_valid = models.BooleanField(
        default=False,
        help_text='Whether GPS location was within the assigned dock geofence',
    )

    notes = models.TextField(blank=True, default='')
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Proof of Delivery'
        verbose_name_plural = 'Proofs of Delivery'

    def __str__(self):
        status = '✅' if self.otp_verified and self.geofence_valid else '⏳'
        return f"{status} PoD: {self.shipment.shipment_number}"

    @property
    def is_complete(self):
        """Check if all PoD requirements are fulfilled."""
        return (
            self.otp_verified
            and self.signature_image
            and self.geofence_valid
            and len(self.cargo_images) > 0
        )
