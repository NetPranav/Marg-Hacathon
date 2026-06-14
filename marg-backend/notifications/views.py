from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import Notification
from .serializers import NotificationSerializer


@extend_schema_view(
    list=extend_schema(tags=['Notifications'], summary='List my notifications'),
    retrieve=extend_schema(tags=['Notifications'], summary='Get notification detail'),
)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Notifications for the authenticated user.
    Read-only: notifications are created by the system, not by users.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @extend_schema(tags=['Notifications'], summary='Get unread notification count')
    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({'success': True, 'unread_count': count})

    @extend_schema(tags=['Notifications'], summary='Mark a notification as read')
    @action(detail=True, methods=['patch'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'success': True, 'message': 'Notification marked as read.'})

    @extend_schema(tags=['Notifications'], summary='Mark all notifications as read')
    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({
            'success': True,
            'message': f'{updated} notifications marked as read.',
        })
