from rest_framework import serializers
from .models import ShipmentEvent, DockReservation


class ShipmentEventSerializer(serializers.ModelSerializer):
    """Read-only serializer for the shipment timeline."""
    performed_by_name = serializers.CharField(
        source='performed_by.full_name', read_only=True, default=None
    )
    event_type_display = serializers.CharField(
        source='get_event_type_display', read_only=True
    )

    class Meta:
        model = ShipmentEvent
        fields = (
            'id', 'event_type', 'event_type_display',
            'description', 'performed_by', 'performed_by_name',
            'metadata', 'created_at',
        )
        read_only_fields = fields


class DockReservationSerializer(serializers.ModelSerializer):
    """Serializer for dock reservations."""
    dock_number = serializers.CharField(
        source='dock.dock_number', read_only=True
    )
    warehouse_name = serializers.CharField(
        source='dock.warehouse.name', read_only=True
    )
    shipment_number = serializers.CharField(
        source='shipment.shipment_number', read_only=True
    )

    class Meta:
        model = DockReservation
        fields = (
            'id', 'shipment', 'shipment_number',
            'dock', 'dock_number', 'warehouse_name',
            'reserved_by', 'reserved_at', 'reservation_status',
            'check_in_time', 'check_out_time',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'reserved_by', 'reserved_at', 'created_at', 'updated_at',
        )


# ─── Action Request Serializers ─────────────────────────────────────────────


class AssignTruckSerializer(serializers.Serializer):
    """Request body for assigning a truck to a shipment."""
    truck_id = serializers.IntegerField()


class AssignDriverSerializer(serializers.Serializer):
    """Request body for assigning a driver to a shipment."""
    driver_id = serializers.IntegerField()


class ReserveDockSerializer(serializers.Serializer):
    """Request body for reserving a dock for a shipment."""
    dock_id = serializers.IntegerField()


class CancelShipmentSerializer(serializers.Serializer):
    """Optional reason for cancellation."""
    reason = serializers.CharField(required=False, default='')
