from rest_framework.routers import DefaultRouter
from .views import ChatRoomViewSet, ChatMessageViewSet
from marketplace.views import LogisticsQuotesViewSet

router = DefaultRouter()
router.register(r'chatrooms', ChatRoomViewSet, basename='chatroom')
router.register(r'messages', ChatMessageViewSet, basename='chatmessage')
router.register(r'quotes', LogisticsQuotesViewSet, basename='lotquote')

urlpatterns = router.urls
