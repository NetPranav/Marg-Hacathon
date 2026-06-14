from django.db import models
from django.conf import settings
from common.models import TimestampMixin
from common.enums import ChatMessageType


class ChatThread(TimestampMixin, models.Model):
    """
    A shipment-scoped communication thread.
    Each shipment gets one thread linking admin + employee + driver.
    """
    shipment = models.ForeignKey(
        'shipments.Shipment',
        on_delete=models.CASCADE,
        related_name='chat_threads',
        null=True, blank=True,
    )
    load = models.ForeignKey(
        'marketplace.MarketplaceLoad',
        on_delete=models.CASCADE,
        related_name='chat_threads',
        null=True, blank=True,
    )
    bid = models.ForeignKey(
        'marketplace.MarketplaceBid',
        on_delete=models.CASCADE,
        related_name='chat_threads',
        null=True, blank=True,
    )
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='chat_threads',
        blank=True,
    )
    is_active = models.BooleanField(default=True)
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-last_message_at']
        verbose_name = 'Chat Thread'
        verbose_name_plural = 'Chat Threads'

    def __str__(self):
        return f"Chat: {self.shipment.shipment_number}" if self.shipment else f"Chat Thread {self.id}"


class ChatMessage(models.Model):
    """
    A message within a shipment chat thread.
    Supports text, images, documents, and system messages.
    """
    thread = models.ForeignKey(
        ChatThread,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='chat_messages',
    )
    message_type = models.CharField(
        max_length=15,
        choices=ChatMessageType.choices,
        default=ChatMessageType.TEXT,
    )
    content = models.TextField(
        help_text='Message text content',
    )
    attachment = models.FileField(
        upload_to='chat_attachments/',
        blank=True, null=True,
        help_text='Optional file attachment',
    )
    is_read = models.BooleanField(default=False)
    read_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='read_messages',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
        indexes = [
            models.Index(fields=['thread', 'created_at']),
        ]

    def __str__(self):
        sender_name = self.sender.full_name if self.sender else 'System'
        return f"{sender_name}: {self.content[:50]}"
