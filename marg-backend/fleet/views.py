from rest_framework import viewsets, permissions
from drf_spectacular.utils import extend_schema, extend_schema_view

from common.enums import UserRole
from .models import Driver, Truck
from .serializers import (
    DriverSerializer, DriverListSerializer,
    TruckSerializer, TruckListSerializer,
)


@extend_schema_view(
    list=extend_schema(tags=['Drivers'], summary='List drivers'),
    create=extend_schema(tags=['Drivers'], summary='Create a driver profile'),
    retrieve=extend_schema(tags=['Drivers'], summary='Get driver detail'),
    partial_update=extend_schema(tags=['Drivers'], summary='Update a driver'),
    destroy=extend_schema(tags=['Drivers'], summary='Delete a driver'),
)
class DriverViewSet(viewsets.ModelViewSet):
    """
    Driver profile management.

    - Super Admin: full CRUD on all drivers.
    - Org managers: read/write access to own organization's drivers.
    - Driver: read-only access to own profile.
    """
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'list':
            return DriverListSerializer
        return DriverSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Driver.objects.select_related('user', 'organization')
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        if user.role == UserRole.DRIVER:
            return qs.filter(user=user)
        return qs.filter(organization=user.organization)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != UserRole.SUPER_ADMIN:
            serializer.save(organization=user.organization)
        else:
            serializer.save()


@extend_schema_view(
    list=extend_schema(tags=['Trucks'], summary='List trucks'),
    create=extend_schema(tags=['Trucks'], summary='Register a truck'),
    retrieve=extend_schema(tags=['Trucks'], summary='Get truck detail'),
    partial_update=extend_schema(tags=['Trucks'], summary='Update a truck'),
    destroy=extend_schema(tags=['Trucks'], summary='Delete a truck'),
)
class TruckViewSet(viewsets.ModelViewSet):
    """
    Truck/vehicle management.

    - Super Admin: full CRUD on all trucks.
    - Org managers: read/write access to own organization's trucks.
    - Driver: read-only access to own assigned truck.
    """
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'list':
            return TruckListSerializer
        return TruckSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Truck.objects.select_related('organization', 'assigned_driver', 'assigned_driver__user')
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        if user.role == UserRole.DRIVER:
            return qs.filter(assigned_driver__user=user)
        return qs.filter(organization=user.organization)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != UserRole.SUPER_ADMIN:
            serializer.save(organization=user.organization)
        else:
            serializer.save()
