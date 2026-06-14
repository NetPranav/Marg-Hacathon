from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Read-only serializer for audit trail entries."""
    actor_email = serializers.EmailField(
        source='actor.email', read_only=True, default=None
    )
    actor_name = serializers.CharField(
        source='actor.full_name', read_only=True, default=None
    )
    action_display = serializers.CharField(
        source='get_action_display', read_only=True
    )
    organization_name = serializers.CharField(
        source='organization.name', read_only=True, default=None
    )

    class Meta:
        model = AuditLog
        fields = (
            'id', 'organization', 'organization_name',
            'actor', 'actor_email', 'actor_name',
            'action', 'action_display',
            'resource_type', 'resource_id',
            'previous_state', 'new_state',
            'ip_address', 'metadata', 'timestamp',
        )
        read_only_fields = fields
