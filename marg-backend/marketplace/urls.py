from rest_framework.routers import DefaultRouter
from .views import LotsViewSet

router = DefaultRouter()
router.register(r'', LotsViewSet, basename='lot')

urlpatterns = router.urls
