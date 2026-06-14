from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from common.enums import UserRole

User = get_user_model()


# ─── OTP & Registration Serializers (Enterprise Platform) ───────────────────

class SendOTPSerializer(serializers.Serializer):
    """Validates the phone number for sending an OTP."""
    phone_number = serializers.CharField(max_length=15, required=True)


class VerifyOTPSerializer(serializers.Serializer):
    """Validates the phone number and OTP code."""
    phone_number = serializers.CharField(max_length=15, required=True)
    otp_code = serializers.CharField(max_length=6, required=True)


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration with role and company context."""
    company_name = serializers.CharField(write_only=True, required=False)
    org_type = serializers.CharField(write_only=True, required=False)
    invite_code = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'email', 'password', 'first_name', 'last_name', 'phone_number',
            'role', 'company_name', 'org_type', 'invite_code',
        )
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        role = attrs.get('role')
        if role == UserRole.ADMIN:
            if not attrs.get('company_name'):
                raise serializers.ValidationError({"company_name": "Required for ADMIN role."})
            if not attrs.get('org_type'):
                raise serializers.ValidationError({"org_type": "Required for ADMIN role."})
        return attrs


# ─── User CRUD Serializers ──────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    """Full user detail serializer (read-oriented)."""
    organization_name = serializers.CharField(
        source='organization.name', read_only=True, default=None
    )

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'role', 'organization', 'organization_name',
            'is_active', 'date_joined',
        )
        read_only_fields = ('id', 'email', 'date_joined')


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users (admin action)."""
    from rest_framework.validators import UniqueValidator
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with this email already exists.")]
    )
    password = serializers.CharField(
        write_only=True, required=True, style={'input_type': 'password'}, min_length=8
    )

    class Meta:
        model = User
        fields = (
            'email', 'password', 'first_name', 'last_name',
            'phone_number', 'role', 'organization',
        )

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profiles."""
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone_number', 'role', 'organization', 'is_active')
        extra_kwargs = {field: {'required': False} for field in fields}


# ─── Auth Serializers ───────────────────────────────────────────────────────

class AuthUserSerializer(serializers.ModelSerializer):
    """Serializer for the /auth/me/ endpoint — includes org details, KYC, and permissions."""
    organization_name = serializers.CharField(
        source='organization.name', read_only=True, default=None
    )
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'role', 'organization', 'organization_name',
            'is_active', 'is_staff', 'date_joined',
            'kyc_status', 'avatar', 'is_phone_verified', 'permissions'
        )
        read_only_fields = fields

    def get_permissions(self, obj):
        perms = []
        if obj.role in (UserRole.SUPER_ADMIN, UserRole.ADMIN):
            perms.extend(['view_dashboard', 'manage_marketplace', 'assign_shipments', 'view_fleet'])
        if obj.role == UserRole.EMPLOYEE:
            perms.extend(['view_task_feed', 'verify_loading', 'chat_shipment'])
        if obj.role == UserRole.DRIVER:
            perms.extend(['view_trips', 'report_delay', 'submit_pod', 'confirm_milestones'])
        return perms


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends the default JWT login to include user role and
    organization info in the response body AND the token payload.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['organization'] = user.organization_id
        token['requires_password_change'] = user.requires_password_change
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'organization': user.organization_id,
            'organization_name': user.organization.name if user.organization else None,
            'kyc_status': user.kyc_status,
            'requires_password_change': user.requires_password_change,
        }
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for first-login password change."""
    new_password = serializers.CharField(required=True, min_length=8, write_only=True)


class LogisticsRegistrationSerializer(serializers.Serializer):
    """Serializer for the 3-step logistics organization registration."""
    # Step 1: Owner Info
    first_name = serializers.CharField(max_length=150, required=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=True)
    phone_number = serializers.CharField(max_length=15, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    
    # Step 2: Company Info
    company_name = serializers.CharField(max_length=255, required=True)
    registration_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    gst_number = serializers.CharField(max_length=50, required=False, allow_blank=True)
    company_address = serializers.CharField(required=False, allow_blank=True)
    coverage_regions = serializers.CharField(required=False, allow_blank=True)

    # Step 3: Fleet Info
    fleet_size = serializers.IntegerField(required=False, default=0)
    vehicle_types = serializers.CharField(required=False, allow_blank=True)
    number_of_drivers = serializers.IntegerField(required=False, default=0)

class ProvisionUserSerializer(serializers.ModelSerializer):
    """Serializer for organization owners to provision employees or drivers."""
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    
    class Meta:
        model = User
        fields = (
            'email', 'password', 'first_name', 'last_name',
            'phone_number', 'role'
        )


