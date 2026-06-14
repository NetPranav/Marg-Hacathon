from rest_framework import serializers
from .models import Factory


class FactorySerializer(serializers.ModelSerializer):
    """Full CRUD serializer for Factory."""
    organization_name = serializers.CharField(
        source='organization.name', read_only=True
    )
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True, default=None
    )

    class Meta:
        model = Factory
        fields = (
            'id', 'organization', 'organization_name', 'name',
            'address', 'city', 'state', 'country',
            'latitude', 'longitude',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_by', 'created_at', 'updated_at')


class FactoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns."""
    class Meta:
        model = Factory
        fields = ('id', 'name', 'city', 'state', 'organization')
