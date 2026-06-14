from rest_framework.routers import DefaultRouter
from .views import ShipmentViewSet, LotViewSet, LotParcelViewSet

router = DefaultRouter()
router.register(r'lots', LotViewSet, basename='lot')
router.register(r'parcels', LotParcelViewSet, basename='lotparcel')
router.register(r'', ShipmentViewSet, basename='shipment')

urlpatterns = router.urls
