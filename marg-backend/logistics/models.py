from django.db import models
from django.conf import settings
from common.models import TimestampMixin
from common.enums import QuoteStatus

class LogisticsCompany(TimestampMixin, models.Model):
    """
    External logistics provider available in the marketplace.
    """
    name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=5.0)
    fleet_size = models.PositiveIntegerField(default=10)
    coverage_regions = models.JSONField(default=list, help_text="List of regions/states covered")
    average_response_time_mins = models.PositiveIntegerField(default=30)
    completed_jobs = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-rating', '-completed_jobs']
        verbose_name_plural = "Logistics Companies"

    def __str__(self):
        return self.name

class ChatRoom(TimestampMixin, models.Model):
    """
    Negotiation room between a Factory and a Logistics Company for a specific Lot.
    """
    factory = models.ForeignKey('factories.Factory', on_delete=models.CASCADE, related_name='chat_rooms')
    logistics_company = models.ForeignKey(LogisticsCompany, on_delete=models.CASCADE, related_name='chat_rooms')
    lot = models.ForeignKey('shipments.Lot', on_delete=models.CASCADE, related_name='chat_rooms')
    
    class Meta:
        unique_together = ('logistics_company', 'lot')

    def __str__(self):
        return f"Chat: {self.factory.name} & {self.logistics_company.name} (Lot: {self.lot.lot_number})"

class ChatMessage(TimestampMixin, models.Model):
    """
    Individual message in a ChatRoom.
    """
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    # If sender is null, it might be a system/logistics company automated message
    is_from_logistics = models.BooleanField(default=False)
    text = models.TextField()
    attachment_url = models.URLField(blank=True, null=True)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message in {self.room.id} at {self.created_at}"

class LotQuote(TimestampMixin, models.Model):
    """
    A quotation offered by the Logistics Company in a ChatRoom.
    """
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='quotes')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    estimated_delivery_hours = models.PositiveIntegerField()
    number_of_vehicles = models.PositiveIntegerField(default=1)
    special_conditions = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=QuoteStatus.choices, default=QuoteStatus.PENDING)

    def __str__(self):
        return f"Quote {self.id} for Room {self.room.id} - {self.status}"
