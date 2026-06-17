from rest_framework import serializers
from .models import Driver, Truck


class DriverSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for Driver."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_phone = serializers.CharField(source='user.phone_number', read_only=True)
    organization_name = serializers.CharField(
        source='organization.name', read_only=True
    )

    class Meta:
        model = Driver
        fields = (
            'id', 'user', 'user_email', 'user_name', 'user_phone',
            'organization', 'organization_name',
            'employee_id', 'license_number', 'license_expiry',
            'aadhaar_number', 'emergency_contact',
            'is_available', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at')


class DriverListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns and assignments."""
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    assigned_vehicle = serializers.CharField(
        source='assigned_truck.registration_number', read_only=True, default=None
    )

    class Meta:
        model = Driver
        fields = ('id', 'user', 'user_name', 'employee_id', 'license_number', 'is_available', 'assigned_vehicle')


class TruckSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for Truck."""
    organization_name = serializers.CharField(
        source='organization.name', read_only=True
    )
    assigned_driver_name = serializers.CharField(
        source='assigned_driver.user.full_name', read_only=True, default=None
    )

    class Meta:
        model = Truck
        fields = (
            'id', 'organization', 'organization_name',
            'registration_number', 'vehicle_type',
            'capacity_kg', 'volume_m3', 'manufacturing_year',
            'status', 'assigned_driver', 'assigned_driver_name',
            'next_service_date', 'insurance_expiry_date', 'fitness_cert_expiry_date',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'organization', 'created_at', 'updated_at')


class TruckListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns."""
    assigned_driver_name = serializers.CharField(
        source='assigned_driver.user.full_name', read_only=True, default=None
    )

    class Meta:
        model = Truck
        fields = ('id', 'registration_number', 'vehicle_type', 'status', 'organization', 'assigned_driver', 'assigned_driver_name', 'next_service_date', 'insurance_expiry_date', 'fitness_cert_expiry_date')
