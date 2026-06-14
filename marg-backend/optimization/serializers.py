from rest_framework import serializers
from .models import ETAPrediction, DockRecommendation, ReturnLoad


class ETAPredictionSerializer(serializers.ModelSerializer):
    shipment_number = serializers.CharField(
        source='shipment.shipment_number', read_only=True
    )

    class Meta:
        model = ETAPrediction
        fields = (
            'id', 'shipment', 'shipment_number',
            'predicted_eta', 'confidence', 'delay_probability',
            'remaining_distance_km', 'generated_at',
        )
        read_only_fields = fields


class DockRecommendationSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    type_display = serializers.CharField(source='get_recommendation_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    resolved_by_name = serializers.CharField(
        source='resolved_by.full_name', read_only=True, default=None
    )

    class Meta:
        model = DockRecommendation
        fields = (
            'id', 'warehouse', 'warehouse_name',
            'recommendation_type', 'type_display',
            'affected_shipments', 'reason',
            'status', 'status_display',
            'resolved_by', 'resolved_by_name', 'resolved_at',
            'created_at', 'updated_at',
        )
        read_only_fields = fields


class ReturnLoadSerializer(serializers.ModelSerializer):
    original_shipment_number = serializers.CharField(
        source='original_shipment.shipment_number', read_only=True
    )
    return_shipment_number = serializers.CharField(
        source='return_shipment.shipment_number', read_only=True
    )
    truck_reg = serializers.CharField(
        source='truck.registration_number', read_only=True
    )
    driver_name = serializers.CharField(
        source='driver.user.full_name', read_only=True
    )
    factory_name = serializers.CharField(
        source='return_shipment.factory.name', read_only=True
    )

    class Meta:
        model = ReturnLoad
        fields = (
            'id', 'original_shipment', 'original_shipment_number',
            'return_shipment', 'return_shipment_number',
            'truck', 'truck_reg',
            'driver', 'driver_name',
            'factory_name',
            'match_score', 'distance_to_pickup', 'estimated_revenue',
            'status', 'created_at', 'updated_at',
        )
        read_only_fields = fields
