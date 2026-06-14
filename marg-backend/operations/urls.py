from django.urls import path
from .dashboard_views import (
    FactoryDashboardView,
    WarehouseDashboardView,
    DriverDashboardView,
)
from .coordination_views import (
    DriverArrivalView,
    GateCheckInApprovalView,
    ExceptionReportView,
)

dashboard_urlpatterns = [
    path('factory/', FactoryDashboardView.as_view(), name='dashboard-factory'),
    path('warehouse/', WarehouseDashboardView.as_view(), name='dashboard-warehouse'),
    path('driver/', DriverDashboardView.as_view(), name='dashboard-driver'),
]

coordination_urlpatterns = [
    path('<str:shipment_id>/arrive/', DriverArrivalView.as_view(), name='driver-arrive'),
    path('<str:shipment_id>/check-in/', GateCheckInApprovalView.as_view(), name='gate-check-in'),
    path('<str:shipment_id>/exceptions/', ExceptionReportView.as_view(), name='report-exception'),
]

urlpatterns = dashboard_urlpatterns + coordination_urlpatterns
