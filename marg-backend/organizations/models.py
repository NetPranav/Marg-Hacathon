from django.db import models
from common.models import TimestampMixin, AddressMixin
from common.enums import OrganizationType


class Organization(TimestampMixin, AddressMixin, models.Model):
    """
    A company/organization on the Marg platform.
    Acts as the top-level tenant — all data is scoped to an organization.
    """
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default='')
    phone_number = models.CharField(max_length=15, blank=True, default='')
    gst_number = models.CharField(
        max_length=15, unique=True, blank=True, null=True,
        help_text='15-digit GST Identification Number',
    )
    org_type = models.CharField(
        max_length=50,
        choices=OrganizationType.choices,
        default=OrganizationType.FACTORY,
    )

    # Enterprise Platform — Company profile
    pan_number = models.CharField(
        max_length=10, blank=True, default='',
        help_text='10-character PAN number',
    )
    company_type = models.CharField(
        max_length=50, blank=True, default='',
        help_text='Type of company (e.g., Logistics, Transport, Fleet)',
    )
    logo = models.ImageField(
        upload_to='company_logos/',
        blank=True,
        null=True,
    )
    is_verified = models.BooleanField(
        default=False,
        help_text='Whether the company has been verified by platform admin',
    )
    metadata = models.JSONField(
        default=dict, 
        blank=True,
        help_text='Flexible schema for org-specific details (e.g. logistics fleet data)'
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'

    def __str__(self):
        return self.name
