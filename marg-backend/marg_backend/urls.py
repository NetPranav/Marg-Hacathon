from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from accounts.urls import auth_urlpatterns, user_urlpatterns
from warehouses.urls import (
    warehouse_urlpatterns, dock_urlpatterns,
    rack_urlpatterns, shelf_urlpatterns,
    parcel_urlpatterns, slotting_urlpatterns,
)
from fleet.urls import driver_urlpatterns, truck_urlpatterns
from operations.urls import dashboard_urlpatterns
from optimization.transit_views import (
    TransitLiveView, TransitShipmentsView, TransitTrucksView,
)
from warehouses.views import WarehouseLayoutView, SlotRecommendView

# Core API v1 routing
api_v1_patterns = [
    # Authentication endpoints
    path('auth/', include(auth_urlpatterns)),

    # Resource endpoints
    path('users/', include(user_urlpatterns)),
    path('organizations/', include('organizations.urls')),
    path('factories/', include('factories.urls')),
    path('warehouses/', include(warehouse_urlpatterns)),
    path('docks/', include(dock_urlpatterns)),
    path('racks/', include(rack_urlpatterns)),
    path('shelves/', include(shelf_urlpatterns)),
    path('parcels/', include(parcel_urlpatterns)),
    path('trucks/', include(truck_urlpatterns)),
    path('drivers/', include(driver_urlpatterns)),
    path('shipments/', include('shipments.urls')),

    # Phase 2 endpoints
    path('notifications/', include('notifications.urls')),
    path('audit-logs/', include('audit.urls')),
    path('dashboard/', include(dashboard_urlpatterns)),
    path('coordination/', include('operations.urls')),

    # Phase 3 endpoints — Intelligence Layer
    path('telemetry/', include('telemetry.urls')),
    path('geofences/', include('geofencing.urls')),
    path('', include('optimization.urls')),  # dock-recommendations/ and return-loads/

    # Phase 7 — Slotting & Space Optimization
    path('racks/', include(rack_urlpatterns)),
    path('shelves/', include(shelf_urlpatterns)),
    path('parcels/', include(parcel_urlpatterns)),
    path('', include(slotting_urlpatterns)),

    # Slotting Endpoints (Burhan)
    path('warehouse-layout/', WarehouseLayoutView.as_view(), name='warehouse-layout'),
    path('warehouse-layout/init/', WarehouseLayoutView.as_view(), name='warehouse-layout-init'),
    path('slotting/recommend/', SlotRecommendView.as_view(), name='slotting-recommend'),

    # Phase 8 — Logistics Marketplace & Lot Management
    path('logistics/', include('logistics.urls')),

    # Transit Dashboard
    path('transit/live/', TransitLiveView.as_view(), name='transit-live'),
    path('transit/shipments/', TransitShipmentsView.as_view(), name='transit-shipments'),
    path('transit/trucks/', TransitTrucksView.as_view(), name='transit-trucks'),

    # Enterprise Platform (Merged)
    # path('marketplace/', include('marketplace.urls')),
    path('chat/', include('chat.urls')), # Chat mapped to chat/
    # path('analytics/', include('analytics.urls')),

    # System endpoints
    path('', include('common.urls')),

    # OpenAPI and API Documentation
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_v1_patterns)),
]

# Serve static/media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
