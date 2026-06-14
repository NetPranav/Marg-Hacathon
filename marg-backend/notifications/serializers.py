from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for listing notifications."""
    shipment_number = serializers.CharField(
        source='related_shipment.shipment_number', read_only=True, default=None
    )

    class Meta:
        model = Notification
        fields = (
            'id', 'title', 'message', 'notification_type',
            'is_read', 'related_shipment', 'shipment_number',
            'created_at',
        )
        read_only_fields = fields
