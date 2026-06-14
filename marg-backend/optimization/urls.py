from rest_framework.routers import DefaultRouter
from .views import DockRecommendationViewSet, ReturnLoadViewSet

router = DefaultRouter()
router.register(r'dock-recommendations', DockRecommendationViewSet, basename='dock-recommendation')
router.register(r'return-loads', ReturnLoadViewSet, basename='return-load')

urlpatterns = router.urls
