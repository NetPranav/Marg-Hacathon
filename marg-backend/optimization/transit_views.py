"""
Transit Dashboard APIs — live operational visibility.
"""
from django.utils import timezone
from django.db.models import Avg, Count, Q, F, Subquery, OuterRef
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from drf_spectacular.utils import extend_schema

from common.enums import UserRole, ShipmentStatus, DockStatus
from shipments.models import Shipment
from fleet.models import Truck, Driver
from telemetry.models import TelemetryPoint
from optimization.models import ETAPrediction
from warehouses.models import DockBay


class TransitLiveView(APIView):
    """
    GET /api/v1/transit/live/
    Aggregated live operational overview: trucks, shipments, docks, alerts.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=['Transit Dashboard'], summary='Live operational overview')
    def get(self, request):
        user = request.user

        # Base querysets org-scoped
        if user.role == UserRole.SUPER_ADMIN:
            shipment_qs = Shipment.objects.all()
            truck_qs = Truck.objects.all()
            dock_qs = DockBay.objects.all()
        elif user.organization:
            shipment_qs = Shipment.objects.filter(
                Q(factory__organization=user.organization) |
                Q(destination_warehouse__organization=user.organization)
            ).distinct()
            truck_qs = Truck.objects.filter(organization=user.organization)
            dock_qs = DockBay.objects.filter(warehouse__organization=user.organization)
        else:
            shipment_qs = Shipment.objects.none()
            truck_qs = Truck.objects.none()
            dock_qs = DockBay.objects.none()

        in_transit = shipment_qs.filter(status=ShipmentStatus.IN_TRANSIT).count()
        ready_for_transit = shipment_qs.filter(status=ShipmentStatus.READY_FOR_TRANSIT).count()
        arrived = shipment_qs.filter(
            status__in=[
                ShipmentStatus.APPROACHING_DESTINATION,
                ShipmentStatus.ARRIVED_AT_GATE,
                ShipmentStatus.RECEIVING_IN_PROGRESS,
                ShipmentStatus.SLOTTING_IN_PROGRESS,
            ]
        ).count()

        # Fleet stats
        total_trucks = truck_qs.count()
        active_trucks = truck_qs.filter(status='IN_TRANSIT').count()
        available_trucks = truck_qs.filter(status='AVAILABLE').count()

        # Dock stats
        total_docks = dock_qs.count()
        occupied_docks = dock_qs.filter(status=DockStatus.OCCUPIED).count()
        available_docks = dock_qs.filter(status=DockStatus.AVAILABLE).count()

        # Fleet utilization
        terminal = [ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED, ShipmentStatus.FAILED]
        total_shipments = shipment_qs.count()
        completed = shipment_qs.filter(status=ShipmentStatus.COMPLETED).count()
        on_time = shipment_qs.filter(
            status=ShipmentStatus.COMPLETED,
            actual_arrival_time__lte=F('expected_arrival_time'),
        ).count() if shipment_qs.filter(status=ShipmentStatus.COMPLETED).exists() else 0

        return Response({
            'success': True,
            'data': {
                'shipments': {
                    'in_transit': in_transit,
                    'ready_for_transit': ready_for_transit,
                    'at_warehouse': arrived,
                    'total_active': in_transit + ready_for_transit + arrived,
                },
                'fleet': {
                    'total_trucks': total_trucks,
                    'active': active_trucks,
                    'available': available_trucks,
                    'utilization_pct': round(
                        (active_trucks / total_trucks * 100) if total_trucks > 0 else 0, 1
                    ),
                },
                'docks': {
                    'total': total_docks,
                    'occupied': occupied_docks,
                    'available': available_docks,
                    'utilization_pct': round(
                        (occupied_docks / total_docks * 100) if total_docks > 0 else 0, 1
                    ),
                },
                'performance': {
                    'total_shipments': total_shipments,
                    'completed': completed,
                    'on_time_delivery_pct': round(
                        (on_time / completed * 100) if completed > 0 else 0, 1
                    ),
                },
            }
        })


class TransitShipmentsView(APIView):
    """
    GET /api/v1/transit/shipments/
    In-transit shipments with live ETA data.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=['Transit Dashboard'], summary='In-transit shipments with ETA')
    def get(self, request):
        user = request.user

        if user.role == UserRole.SUPER_ADMIN:
            qs = Shipment.objects.all()
        elif user.organization:
            qs = Shipment.objects.filter(
                Q(factory__organization=user.organization) |
                Q(destination_warehouse__organization=user.organization)
            ).distinct()
        else:
            qs = Shipment.objects.none()

        active = qs.filter(
            status__in=[
                ShipmentStatus.READY_FOR_TRANSIT,
                ShipmentStatus.IN_TRANSIT,
                ShipmentStatus.APPROACHING_DESTINATION,
                ShipmentStatus.ARRIVED_AT_GATE,
                ShipmentStatus.RECEIVING_IN_PROGRESS,
                ShipmentStatus.SLOTTING_IN_PROGRESS,
            ]
        ).select_related(
            'factory', 'destination_warehouse',
            'assigned_truck', 'assigned_driver', 'assigned_driver__user',
        )

        results = []
        for shipment in active:
            # Get latest ETA
            eta = ETAPrediction.objects.filter(shipment=shipment).first()
            eta_data = None
            if eta:
                eta_data = {
                    'predicted_eta': eta.predicted_eta.isoformat(),
                    'confidence': float(eta.confidence),
                    'delay_probability': float(eta.delay_probability),
                    'remaining_distance_km': float(eta.remaining_distance_km) if eta.remaining_distance_km else None,
                }

            results.append({
                'id': shipment.id,
                'shipment_number': shipment.shipment_number,
                'status': shipment.status,
                'factory': shipment.factory.name if shipment.factory else None,
                'destination': shipment.destination_warehouse.name if shipment.destination_warehouse else None,
                'truck': shipment.assigned_truck.registration_number if shipment.assigned_truck else None,
                'driver': shipment.assigned_driver.user.full_name if shipment.assigned_driver else None,
                'dispatched_at': shipment.actual_dispatch_time.isoformat() if shipment.actual_dispatch_time else None,
                'expected_arrival': shipment.expected_arrival_time.isoformat() if shipment.expected_arrival_time else None,
                'eta': eta_data,
            })

        return Response({'success': True, 'data': results})


class TransitTrucksView(APIView):
    """
    GET /api/v1/transit/trucks/
    Fleet location map data — all trucks with last known positions.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=['Transit Dashboard'], summary='Fleet location map data')
    def get(self, request):
        user = request.user

        if user.role == UserRole.SUPER_ADMIN:
            truck_qs = Truck.objects.all()
        elif user.organization:
            truck_qs = Truck.objects.filter(organization=user.organization)
        else:
            truck_qs = Truck.objects.none()

        results = []
        for truck in truck_qs.select_related('organization'):
            # Get latest telemetry
            latest = TelemetryPoint.objects.filter(
                truck=truck,
            ).select_related('driver__user', 'shipment').order_by('-recorded_at').first()

            results.append({
                'id': truck.id,
                'registration_number': truck.registration_number,
                'vehicle_type': truck.vehicle_type,
                'status': truck.status,
                'location': {
                    'latitude': float(latest.latitude) if latest else None,
                    'longitude': float(latest.longitude) if latest else None,
                    'speed': float(latest.speed) if latest else None,
                    'heading': float(latest.heading) if latest else None,
                    'updated_at': latest.recorded_at.isoformat() if latest else None,
                } if latest else None,
                'driver': latest.driver.user.full_name if latest and latest.driver else None,
                'shipment': latest.shipment.shipment_number if latest and latest.shipment else None,
            })

        return Response({'success': True, 'data': results})
