from django.contrib import admin
from .models import LogisticsCompany, ChatRoom, ChatMessage, LotQuote

@admin.register(LogisticsCompany)
class LogisticsCompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_email', 'rating', 'fleet_size', 'completed_jobs')
    search_fields = ('name', 'contact_email')
    list_filter = ('rating',)

@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'factory', 'logistics_company', 'lot')
    search_fields = ('factory__name', 'logistics_company__name', 'lot__lot_number')

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'sender', 'is_from_logistics', 'created_at')
    search_fields = ('text',)
    list_filter = ('is_from_logistics', 'read')

@admin.register(LotQuote)
class LotQuoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'price', 'currency', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('room__lot__lot_number',)
