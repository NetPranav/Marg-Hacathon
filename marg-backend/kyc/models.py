from django.db import models
from django.conf import settings
from common.models import TimestampMixin
from common.enums import KycStatus, KycDocumentType, UserRole


class KycSubmission(TimestampMixin, models.Model):
    """
    A KYC document submission. Users submit documents based on their role:
    - ADMIN: GSTIN, PAN, Company Registration
    - EMPLOYEE: Invite code validation (handled separately)
    - DRIVER: Driving License, Profile Photo, Vahan verification
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='kyc_submissions',
    )
    document_type = models.CharField(
        max_length=30,
        choices=KycDocumentType.choices,
    )
    document_value = models.CharField(
        max_length=255, blank=True, default='',
        help_text='Document number or value (e.g., GSTIN, PAN)',
    )
    document_image = models.ImageField(
        upload_to='kyc_documents/',
        blank=True, null=True,
        help_text='Scanned/photographed document',
    )
    status = models.CharField(
        max_length=20,
        choices=KycStatus.choices,
        default=KycStatus.SUBMITTED,
    )
    rejection_reason = models.TextField(
        blank=True, default='',
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='verified_kyc_submissions',
    )
    verified_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'KYC Submission'
        verbose_name_plural = 'KYC Submissions'

    def __str__(self):
        return f"KYC: {self.user.email} — {self.get_document_type_display()} ({self.get_status_display()})"


class InviteCode(TimestampMixin, models.Model):
    """
    Invite codes for employee onboarding.
    Admin creates codes, employees use them to join the company.
    """
    code = models.CharField(max_length=20, unique=True)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='invite_codes',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_invite_codes',
    )
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.EMPLOYEE,
        help_text='Role assigned when this code is used',
    )
    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='used_invite_code',
    )
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Invite Code'
        verbose_name_plural = 'Invite Codes'

    def __str__(self):
        status = 'Used' if self.is_used else 'Available'
        return f"{self.code} — {self.organization.name} ({status})"
