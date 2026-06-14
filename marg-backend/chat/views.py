from rest_framework import viewsets, permissions
from .models import ChatThread, ChatMessage
from .serializers import ChatThreadSerializer, ChatMessageSerializer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class ChatRoomViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing chat rooms.
    Maps to /api/v1/freight/chatrooms/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatThreadSerializer

    def get_queryset(self):
        user = self.request.user
        # Users can only see threads they are participants in, OR 
        # threads related to their organization's shipments/bids.
        if user.role == 'SUPER_ADMIN':
            return ChatThread.objects.all()
        return ChatThread.objects.filter(participants=user).order_by('-last_message_at')


class ChatMessageViewSet(viewsets.ModelViewSet):
    """
    API endpoint for sending/receiving messages.
    Maps to /api/v1/freight/messages/
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChatMessageSerializer

    def get_queryset(self):
        thread_id = self.request.query_params.get('thread_id')
        if thread_id:
            return ChatMessage.objects.filter(thread_id=thread_id).order_by('created_at')
        return ChatMessage.objects.filter(thread__participants=self.request.user).order_by('created_at')

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        thread = message.thread
        
        # Update thread last message time
        thread.last_message_at = message.created_at
        thread.save()

        # Emit to WebSocket
        channel_layer = get_channel_layer()
        room_group_name = f'chat_{thread.id}'
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'chat_message',
                'message': ChatMessageSerializer(message).data
            }
        )
