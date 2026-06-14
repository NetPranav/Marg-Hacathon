from rest_framework import serializers
from .models import Organization


class OrganizationSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for Organization."""
    member_count = serializers.IntegerField(source='members.count', read_only=True)

    class Meta:
        model = Organization
        fields = (
            'id', 'name', 'email', 'phone_number', 'gst_number',
            'address', 'city', 'state', 'country', 'org_type',
            'pan_number', 'company_type', 'logo', 'is_verified', 'metadata',
            'member_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class OrganizationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns and references."""
    class Meta:
        model = Organization
        fields = ('id', 'name', 'city', 'state')
