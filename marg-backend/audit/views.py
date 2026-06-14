from rest_framework import viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view

from common.permissions import IsSuperAdmin
from .models import AuditLog
from .serializers import AuditLogSerializer


@extend_schema_view(
    list=extend_schema(tags=['Audit'], summary='List audit logs'),
    retrieve=extend_schema(tags=['Audit'], summary='Get audit log detail'),
)
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Immutable audit trail — Super Admin access only.
    Supports filtering by action, resource_type, and organization.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]
    filterset_fields = ['action', 'resource_type', 'organization']
    search_fields = ['actor__email', 'resource_type']

    def get_queryset(self):
        return AuditLog.objects.select_related('actor', 'organization').all()
