from rest_framework import viewsets, permissions
from drf_spectacular.utils import extend_schema, extend_schema_view

from common.enums import UserRole
from common.permissions import IsSuperAdmin, IsOrganizationMember
from .models import Organization
from .serializers import OrganizationSerializer, OrganizationListSerializer


@extend_schema_view(
    list=extend_schema(tags=['Organizations'], summary='List organizations'),
    create=extend_schema(tags=['Organizations'], summary='Create an organization'),
    retrieve=extend_schema(tags=['Organizations'], summary='Get organization detail'),
    partial_update=extend_schema(tags=['Organizations'], summary='Update an organization'),
    destroy=extend_schema(tags=['Organizations'], summary='Delete an organization'),
)
class OrganizationViewSet(viewsets.ModelViewSet):
    """
    Organization management.

    - Super Admin: full CRUD on all organizations.
    - Org members: read-only access to their own organization.
    """
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            return [IsSuperAdmin()]
        if self.action == 'partial_update':
            return [permissions.IsAuthenticated(), IsOrganizationMember()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return OrganizationListSerializer
        return OrganizationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.SUPER_ADMIN:
            return Organization.objects.all()
        # Non-admins can only see their own organization
        if user.organization:
            return Organization.objects.filter(id=user.organization_id)
        return Organization.objects.none()
