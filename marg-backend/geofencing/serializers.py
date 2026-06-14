from rest_framework import serializers
from .models import Geofence


class GeofenceSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True, default=None)
    factory_name = serializers.CharField(source='factory.name', read_only=True, default=None)

    class Meta:
        model = Geofence
        fields = (
            'id', 'name', 'warehouse', 'warehouse_name',
            'factory', 'factory_name',
            'latitude', 'longitude', 'radius_km', 'is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')
