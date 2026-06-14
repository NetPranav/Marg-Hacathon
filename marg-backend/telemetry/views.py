from django.db.models import Subquery, OuterRef
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from drf_spectacular.utils import extend_schema

from common.enums import UserRole
from fleet.models import Driver
from .models import TelemetryPoint
from .serializers import (
    TelemetryIngestSerializer,
    TelemetryPointSerializer,
    LatestLocationSerializer,
)


class TelemetryIngestView(APIView):
    """
    POST /api/v1/telemetry/
    Ingest a GPS telemetry data point from the driver's device.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Telemetry'],
        summary='Submit a telemetry data point',
        request=TelemetryIngestSerializer,
    )
    def post(self, request):
        serializer = TelemetryIngestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Resolve driver from authenticated user
        try:
            driver = Driver.objects.select_related('user').get(user=request.user)
        except Driver.DoesNotExist:
            return Response(
                {'success': False, 'message': 'No driver profile found for this user.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the assigned truck — try driver's OneToOne, then shipment's assigned truck
        truck = getattr(driver, 'assigned_truck', None)
        if not truck and data.get('shipment_id'):
            from shipments.models import Shipment
            try:
                shipment = Shipment.objects.get(id=data['shipment_id'])
                truck = shipment.assigned_truck
            except Shipment.DoesNotExist:
                pass

        point = TelemetryPoint.objects.create(
            driver=driver,
            truck=truck,
            shipment_id=data.get('shipment_id'),
            latitude=data['latitude'],
            longitude=data['longitude'],
            speed=data.get('speed', 0),
            heading=data.get('heading', 0),
            battery_level=data.get('battery_level', 100),
            recorded_at=data['timestamp'],
        )

        return Response({
            'success': True,
            'message': 'Telemetry point recorded.',
            'data': {'id': point.id, 'recorded_at': point.recorded_at},
        }, status=status.HTTP_201_CREATED)


class TelemetryLatestView(APIView):
    """
    GET /api/v1/telemetry/latest/
    Returns the most recent telemetry point for each active driver.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=['Telemetry'], summary='Get latest location for all active drivers')
    def get(self, request):
        user = request.user

        # Get the latest telemetry point per driver using a subquery
        latest_ids = TelemetryPoint.objects.filter(
            driver=OuterRef('driver')
        ).order_by('-recorded_at').values('id')[:1]

        qs = TelemetryPoint.objects.filter(
            id__in=Subquery(
                TelemetryPoint.objects.values('driver').annotate(
                    latest_id=Subquery(
                        TelemetryPoint.objects.filter(
                            driver_id=OuterRef('driver')
                        ).order_by('-recorded_at').values('id')[:1]
                    )
                ).values('latest_id')
            )
        ).select_related('driver__user', 'truck', 'shipment')

        # Org-scope
        if user.role != UserRole.SUPER_ADMIN and user.organization:
            qs = qs.filter(driver__organization=user.organization)

        results = []
        for pt in qs:
            results.append({
                'driver_id': pt.driver_id,
                'driver_name': pt.driver.user.full_name,
                'truck_id': pt.truck_id,
                'truck_reg': pt.truck.registration_number if pt.truck else None,
                'shipment_id': pt.shipment_id,
                'latitude': pt.latitude,
                'longitude': pt.longitude,
                'speed': pt.speed,
                'heading': pt.heading,
                'battery_level': pt.battery_level,
                'recorded_at': pt.recorded_at,
            })

        return Response({'success': True, 'data': results})


class TelemetryHistoryView(APIView):
    """
    GET /api/v1/telemetry/history/?shipment_id=X&driver_id=Y
    Returns telemetry trail for a shipment or driver.
    """
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=['Telemetry'], summary='Get telemetry history for a shipment or driver')
    def get(self, request):
        shipment_id = request.query_params.get('shipment_id')
        driver_id = request.query_params.get('driver_id')

        if not shipment_id and not driver_id:
            return Response(
                {'success': False, 'message': 'Provide shipment_id or driver_id query parameter.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = TelemetryPoint.objects.select_related('driver__user', 'truck')

        if shipment_id:
            qs = qs.filter(shipment_id=shipment_id)
        elif driver_id:
            qs = qs.filter(driver_id=driver_id)

        qs = qs.order_by('recorded_at')[:500]  # Cap at 500 points
        serializer = TelemetryPointSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})
