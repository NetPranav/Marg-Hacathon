from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from common.enums import UserRole, KycStatus


class UserManager(BaseUserManager):
    """Custom manager for email-based authentication (no username)."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.SUPER_ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model for the Marg platform.
    Uses email as the primary authentication field.
    """
    # Remove username field — we authenticate via email
    username = None

    email = models.EmailField('email address', unique=True)
    first_name = models.CharField('first name', max_length=150)
    last_name = models.CharField('last name', max_length=150, blank=True, default='')
    phone_number = models.CharField(max_length=15, blank=True, default='')
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.DRIVER,
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members',
        help_text='Organization this user belongs to. Null for Super Admins.',
    )

    # Enterprise Platform — KYC & Profile
    kyc_status = models.CharField(
        max_length=20,
        choices=KycStatus.choices,
        default=KycStatus.PENDING,
        help_text='KYC verification status',
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text='User profile photo',
    )
    is_phone_verified = models.BooleanField(
        default=False,
        help_text='Whether phone number has been verified via OTP',
    )
    requires_password_change = models.BooleanField(
        default=False,
        help_text='Forces the user to change their password on first login (for provisioned accounts)',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

    objects = UserManager()

    class Meta:
        ordering = ['-date_joined']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_admin_role(self):
        """Check if user has admin-level access (SUPER_ADMIN or ADMIN)."""
        return self.role in (UserRole.SUPER_ADMIN, UserRole.ADMIN)

    @property
    def is_field_role(self):
        """Check if user has field-level role (EMPLOYEE or DRIVER)."""
        return self.role in (UserRole.EMPLOYEE, UserRole.DRIVER)
