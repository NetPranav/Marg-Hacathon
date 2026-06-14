from django.db.models import Q
from rest_framework import viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view
from common.enums import UserRole
from .models import Geofence
from .serializers import GeofenceSerializer


@extend_schema_view(
    list=extend_schema(tags=['Geofencing'], summary='List geofences'),
    create=extend_schema(tags=['Geofencing'], summary='Create a geofence'),
    retrieve=extend_schema(tags=['Geofencing'], summary='Get geofence detail'),
    partial_update=extend_schema(tags=['Geofencing'], summary='Update a geofence'),
    destroy=extend_schema(tags=['Geofencing'], summary='Delete a geofence'),
)
class GeofenceViewSet(viewsets.ModelViewSet):
    """CRUD for geofences. Org-scoped for non-admins."""
    serializer_class = GeofenceSerializer
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        user = self.request.user
        qs = Geofence.objects.select_related('warehouse', 'factory')
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        org = user.organization
        if not org:
            return qs.none()
        return qs.filter(
            Q(warehouse__organization=org) | Q(factory__organization=org)
        )
