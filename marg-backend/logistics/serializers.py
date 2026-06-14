from rest_framework import serializers
from .models import LogisticsCompany, ChatRoom, ChatMessage, LotQuote

class LogisticsCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogisticsCompany
        fields = '__all__'

class LotQuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LotQuote
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name', read_only=True, default=None)

    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

class ChatRoomSerializer(serializers.ModelSerializer):
    factory_name = serializers.CharField(source='factory.name', read_only=True)
    logistics_company_name = serializers.CharField(source='logistics_company.name', read_only=True)
    lot_number = serializers.CharField(source='lot.lot_number', read_only=True)
    
    # We will nest messages and quotes for ease of the chat UI
    messages = ChatMessageSerializer(many=True, read_only=True)
    quotes = LotQuoteSerializer(many=True, read_only=True)

    class Meta:
        model = ChatRoom
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
