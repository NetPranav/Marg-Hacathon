from rest_framework.routers import DefaultRouter
from .views import LogisticsCompanyViewSet, ChatRoomViewSet, ChatMessageViewSet, LotQuoteViewSet

router = DefaultRouter()
router.register(r'companies', LogisticsCompanyViewSet, basename='logistics_company')
router.register(r'chatrooms', ChatRoomViewSet, basename='chatroom')
router.register(r'messages', ChatMessageViewSet, basename='chatmessage')
router.register(r'quotes', LotQuoteViewSet, basename='lotquote')

urlpatterns = router.urls
