from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q, Sum

from shipments.models import Shipment
from fleet.models import Truck, Driver
from common.enums import ShipmentStatus, TruckStatus, UserRole

class AnalyticsOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Filter logic based on organization if not super admin
        shipments_query = Shipment.objects.all()
        trucks_query = Truck.objects.all()
        drivers_query = Driver.objects.all()
        
        if user.role != UserRole.SUPER_ADMIN and user.organization:
            shipments_query = shipments_query.filter(
                Q(factory__organization=user.organization) | 
                Q(logistics_provider=user.organization)
            )
            trucks_query = trucks_query.filter(organization=user.organization)
            drivers_query = drivers_query.filter(organization=user.organization)

        # Overview Stats
        active_shipments = shipments_query.filter(status__in=[
            ShipmentStatus.READY_FOR_TRANSIT, ShipmentStatus.IN_TRANSIT, ShipmentStatus.APPROACHING_DESTINATION, ShipmentStatus.ARRIVED_AT_GATE
        ]).count()
        
        completed_shipments = shipments_query.filter(status=ShipmentStatus.COMPLETED).count()
        
        total_revenue = 0  # Placeholder, typically sum of accepted bids
        
        # Fleet Utilization
        total_trucks = trucks_query.count()
        active_trucks = trucks_query.filter(status=TruckStatus.IN_TRANSIT).count()
        utilization = round((active_trucks / total_trucks * 100) if total_trucks > 0 else 0, 1)

        # Build chart data (mocked 7 days trend for now, ideally derived from DB dates)
        trend_data = [
            {"name": "Mon", "revenue": 12000, "shipments": 4},
            {"name": "Tue", "revenue": 19000, "shipments": 7},
            {"name": "Wed", "revenue": 15000, "shipments": 5},
            {"name": "Thu", "revenue": 22000, "shipments": 8},
            {"name": "Fri", "revenue": 28000, "shipments": 10},
            {"name": "Sat", "revenue": 14000, "shipments": 4},
            {"name": "Sun", "revenue": 9000, "shipments": 2},
        ]

        return Response({
            "active_shipments": active_shipments,
            "completed_shipments": completed_shipments,
            "total_revenue_inr": total_revenue,
            "fleet_utilization_pct": utilization,
            "trend": trend_data
        })


class FleetAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        drivers_query = Driver.objects.all()
        if user.role != UserRole.SUPER_ADMIN and user.organization:
            drivers_query = drivers_query.filter(organization=user.organization)
            
        top_drivers = []
        for d in drivers_query[:5]:
            top_drivers.append({
                "id": d.id,
                "name": f"{d.user.first_name} {d.user.last_name}" if d.user else "Unknown",
                "on_time_rate": 98.5, # Mock metric
                "trips": 42
            })
            
        return Response({
            "top_drivers": top_drivers,
            "delayed_trucks": 2, # Mock
        })


class IntelligenceInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # AI generated insights (Hardcoded for demo, normally pulled from an ML service or DB anomaly detection)
        insights = [
            {
                "id": 1,
                "type": "SUCCESS",
                "message": "Driver Rajesh has highest on-time delivery rate this week (99.2%).",
                "severity": "LOW"
            },
            {
                "id": 2,
                "type": "WARNING",
                "message": "Route Mumbai → Indore experiencing recurring delays due to monsoon.",
                "severity": "MEDIUM"
            },
            {
                "id": 3,
                "type": "ALERT",
                "message": "Truck MH12AB2231 underutilized by 34% compared to fleet average.",
                "severity": "HIGH"
            },
            {
                "id": 4,
                "type": "WARNING",
                "message": "Warehouse Dock 12 causing repeated unloading bottlenecks (Avg wait: 45m).",
                "severity": "MEDIUM"
            }
        ]
        return Response({"insights": insights})
