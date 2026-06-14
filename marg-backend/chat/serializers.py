from rest_framework import serializers
from .models import ChatThread, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatUserSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'role', 'organization_name']

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_details = ChatUserSerializer(source='sender', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ('created_at', 'is_read', 'read_by', 'sender')

class ChatThreadSerializer(serializers.ModelSerializer):
    participants_details = ChatUserSerializer(source='participants', many=True, read_only=True)
    latest_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatThread
        fields = '__all__'

    def get_latest_message(self, obj):
        msg = obj.messages.order_by('-created_at').first()
        if msg:
            return ChatMessageSerializer(msg).data
        return None
