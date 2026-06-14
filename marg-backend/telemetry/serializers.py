from rest_framework import serializers
from .models import TelemetryPoint


class TelemetryIngestSerializer(serializers.Serializer):
    """Serializer for the telemetry ingestion endpoint (driver POST)."""
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    speed = serializers.DecimalField(max_digits=6, decimal_places=2, default=0)
    heading = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)
    battery_level = serializers.IntegerField(min_value=0, max_value=100, default=100)
    shipment_id = serializers.IntegerField(required=False, allow_null=True)
    timestamp = serializers.DateTimeField()


class TelemetryPointSerializer(serializers.ModelSerializer):
    """Read serializer for telemetry data."""
    driver_name = serializers.CharField(
        source='driver.user.full_name', read_only=True, default=None
    )
    truck_reg = serializers.CharField(
        source='truck.registration_number', read_only=True, default=None
    )
    shipment_number = serializers.CharField(
        source='shipment.shipment_number', read_only=True, default=None
    )

    class Meta:
        model = TelemetryPoint
        fields = (
            'id', 'driver', 'driver_name',
            'truck', 'truck_reg',
            'shipment', 'shipment_number',
            'latitude', 'longitude',
            'speed', 'heading', 'battery_level',
            'recorded_at',
        )
        read_only_fields = fields


class LatestLocationSerializer(serializers.Serializer):
    """Lightweight serializer for latest truck locations."""
    driver_id = serializers.IntegerField()
    driver_name = serializers.CharField()
    truck_id = serializers.IntegerField(allow_null=True)
    truck_reg = serializers.CharField(allow_null=True)
    shipment_id = serializers.IntegerField(allow_null=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    speed = serializers.DecimalField(max_digits=6, decimal_places=2)
    heading = serializers.DecimalField(max_digits=5, decimal_places=2)
    battery_level = serializers.IntegerField()
    recorded_at = serializers.DateTimeField()
