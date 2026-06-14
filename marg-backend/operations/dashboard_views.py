"""
Dashboard summary API views for Factory, Warehouse, and Driver portals.
"""
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from drf_spectacular.utils import extend_schema

from common.enums import UserRole, ShipmentStatus, DockStatus
from shipments.models import Shipment
from warehouses.models import DockBay, Warehouse


class FactoryDashboardView(APIView):
    """Dashboard summary for Factory Managers."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=['Dashboards'], summary='Factory dashboard summary')
    def get(self, request):
        user = request.user
        if user.role not in (UserRole.SUPER_ADMIN, UserRole.FACTORY_MANAGER):
            return Response({'success': False, 'message': 'Access denied.'}, status=403)

        org = user.organization
        today = timezone.now().date()

        # Base queryset — shipments from this org's factories
        qs = Shipment.objects.filter(factory__organization=org) if org else Shipment.objects.all()

        terminal_statuses = [ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED, ShipmentStatus.FAILED]
        active = qs.exclude(status__in=terminal_statuses).count()
        completed_today = qs.filter(
            status=ShipmentStatus.COMPLETED,
            updated_at__date=today,
        ).count()
        pending_dispatch = qs.filter(
            status__in=[
                ShipmentStatus.DRAFT,
                ShipmentStatus.WAREHOUSE_APPROVED,
                ShipmentStatus.LOGISTICS_SELECTED,
                ShipmentStatus.DRIVER_ASSIGNED,
                ShipmentStatus.READY_FOR_PICKUP,
                ShipmentStatus.LOADING_IN_PROGRESS,
                ShipmentStatus.READY_FOR_TRANSIT,
            ]
        ).count()
        in_transit = qs.filter(status=ShipmentStatus.IN_TRANSIT).count()

        return Response({
            'success': True,
            'data': {
                'active_shipments': active,
                'completed_today': completed_today,
                'pending_dispatch': pending_dispatch,
                'in_transit': in_transit,
            }
        })


class WarehouseDashboardView(APIView):
    """Dashboard summary for Warehouse Managers."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=['Dashboards'], summary='Warehouse dashboard summary')
    def get(self, request):
        user = request.user
        if user.role not in (UserRole.SUPER_ADMIN, UserRole.WAREHOUSE_MANAGER):
            return Response({'success': False, 'message': 'Access denied.'}, status=403)

        org = user.organization

        # Incoming shipments to this org's warehouses
        incoming_qs = Shipment.objects.filter(
            destination_warehouse__organization=org
        ) if org else Shipment.objects.all()

        incoming = incoming_qs.filter(
            status__in=[
                ShipmentStatus.READY_FOR_TRANSIT,
                ShipmentStatus.IN_TRANSIT,
                ShipmentStatus.APPROACHING_DESTINATION,
                ShipmentStatus.ARRIVED_AT_GATE,
                ShipmentStatus.RECEIVING_IN_PROGRESS,
                ShipmentStatus.SLOTTING_IN_PROGRESS,
            ]
        ).count()

        # Dock stats
        dock_qs = DockBay.objects.filter(
            warehouse__organization=org
        ) if org else DockBay.objects.all()

        total_docks = dock_qs.count()
        occupied = dock_qs.filter(status=DockStatus.OCCUPIED).count()
        reserved = dock_qs.filter(status=DockStatus.RESERVED).count()
        available = dock_qs.filter(status=DockStatus.AVAILABLE).count()

        # Capacity stats
        warehouse = Warehouse.objects.filter(organization=org).first() if org else Warehouse.objects.first()
        capacity_data = {
            'capacity': warehouse.capacity if warehouse else 0,
            'occupied_slots': warehouse.occupied_slots if warehouse else 0,
            'available_slots': warehouse.available_slots if warehouse else 0,
            'reserved_capacity': warehouse.reserved_capacity if warehouse else 0,
            'forwarding_capacity': warehouse.forwarding_capacity if warehouse else 0,
        }

        return Response({
            'success': True,
            'data': {
                'incoming_shipments': incoming,
                'total_docks': total_docks,
                'occupied_docks': occupied,
                'reserved_docks': reserved,
                'available_docks': available,
                **capacity_data
            }
        })


class DriverDashboardView(APIView):
    """Dashboard summary for Drivers."""
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=['Dashboards'], summary='Driver dashboard summary')
    def get(self, request):
        user = request.user
        if user.role not in (UserRole.SUPER_ADMIN, UserRole.DRIVER):
            return Response({'success': False, 'message': 'Access denied.'}, status=403)

        terminal_statuses = [ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED, ShipmentStatus.FAILED]

        assigned = Shipment.objects.filter(
            assigned_driver__user=user,
        ).exclude(status__in=terminal_statuses).count()

        active_trip = Shipment.objects.filter(
            assigned_driver__user=user,
            status=ShipmentStatus.IN_TRANSIT,
        ).count()

        completed = Shipment.objects.filter(
            assigned_driver__user=user,
            status=ShipmentStatus.COMPLETED,
        ).count()

        return Response({
            'success': True,
            'data': {
                'assigned_shipments': assigned,
                'active_trip': active_trip,
                'completed_total': completed,
            }
        })
