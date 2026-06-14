from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    WarehouseViewSet, DockBayViewSet,
    RackViewSet, ShelfViewSet, ParcelViewSet,
    WarehouseLayoutView, SlotRecommendView,
    SlotAssignView, ManualOverrideView,
    GlobalWarehouseRegistryViewSet,
)

router = DefaultRouter()
router.register(r'global-registry', GlobalWarehouseRegistryViewSet, basename='warehouse-global')
router.register(r'', WarehouseViewSet, basename='warehouse')

dock_router = DefaultRouter()
dock_router.register(r'', DockBayViewSet, basename='dock')

# Phase 7 routers
rack_router = DefaultRouter()
rack_router.register(r'', RackViewSet, basename='rack')

shelf_router = DefaultRouter()
shelf_router.register(r'', ShelfViewSet, basename='shelf')

parcel_router = DefaultRouter()
parcel_router.register(r'', ParcelViewSet, basename='parcel')

warehouse_urlpatterns = router.urls
dock_urlpatterns = dock_router.urls
rack_urlpatterns = rack_router.urls
shelf_urlpatterns = shelf_router.urls
parcel_urlpatterns = parcel_router.urls
# Phase 7 API views
slotting_urlpatterns = [
    path('warehouse-layout/', WarehouseLayoutView.as_view(), name='warehouse-layout'),
    path('slotting/recommend/', SlotRecommendView.as_view(), name='slotting-recommend'),
    path('slotting/assign/', SlotAssignView.as_view(), name='slotting-assign'),
    path('slotting/manual-override/', ManualOverrideView.as_view(), name='slotting-manual-override'),
]
