from rest_framework import viewsets, permissions
from drf_spectacular.utils import extend_schema, extend_schema_view

from common.enums import UserRole
from common.permissions import IsSuperAdmin
from .models import Factory
from .serializers import FactorySerializer, FactoryListSerializer


@extend_schema_view(
    list=extend_schema(tags=['Factories'], summary='List factories'),
    create=extend_schema(tags=['Factories'], summary='Create a factory'),
    retrieve=extend_schema(tags=['Factories'], summary='Get factory detail'),
    partial_update=extend_schema(tags=['Factories'], summary='Update a factory'),
    destroy=extend_schema(tags=['Factories'], summary='Delete a factory'),
)
class FactoryViewSet(viewsets.ModelViewSet):
    """
    Factory management.

    - Super Admin: full CRUD on all factories.
    - Factory Manager: full CRUD on own organization's factories.
    - Others: read-only access to own organization's factories.
    """
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_permissions(self):
        if self.action in ('create', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return FactoryListSerializer
        return FactorySerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.SUPER_ADMIN:
            return Factory.objects.select_related('organization', 'created_by').all()
        return Factory.objects.select_related('organization', 'created_by').filter(
            organization=user.organization
        )

    def perform_create(self, serializer):
        user = self.request.user
        save_kwargs = {'created_by': user}
        # Non-super-admin users can only create for their own org
        if user.role != UserRole.SUPER_ADMIN:
            save_kwargs['organization'] = user.organization
        serializer.save(**save_kwargs)
