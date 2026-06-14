from rest_framework.routers import DefaultRouter
from .views import DriverViewSet, TruckViewSet

driver_router = DefaultRouter()
driver_router.register(r'', DriverViewSet, basename='driver')

truck_router = DefaultRouter()
truck_router.register(r'', TruckViewSet, basename='truck')

driver_urlpatterns = driver_router.urls
truck_urlpatterns = truck_router.urls
