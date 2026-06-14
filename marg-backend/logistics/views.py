from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.utils import timezone
import random

from common.enums import UserRole, LotStatus, QuoteStatus, ShipmentStatus, ShipmentPriority, ShipmentType
from shipments.models import Shipment
from operations.models import ShipmentEvent
from common.enums import ShipmentEventType

from .models import LogisticsCompany, ChatRoom, ChatMessage, LotQuote
from .serializers import (
    LogisticsCompanySerializer, ChatRoomSerializer, 
    ChatMessageSerializer, LotQuoteSerializer
)


class LogisticsCompanyViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Marketplace directory of logistics companies. Read-only for Factories.
    """
    queryset = LogisticsCompany.objects.all()
    serializer_class = LogisticsCompanySerializer
    permission_classes = [permissions.IsAuthenticated]


class ChatRoomViewSet(viewsets.ModelViewSet):
    """
    Chat rooms between Factories and Logistics Companies.
    """
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.SUPER_ADMIN:
            return ChatRoom.objects.all()
        if user.role == UserRole.FACTORY_MANAGER:
            return ChatRoom.objects.filter(factory__organization=user.organization)
        if user.role == UserRole.ADMIN:
            return ChatRoom.objects.filter(logistics_company__name=user.organization.name)
        return ChatRoom.objects.none()

    def create(self, request, *args, **kwargs):
        logistics_company = request.data.get('logistics_company')
        lot = request.data.get('lot')
        
        # Check if chat room already exists
        existing_room = ChatRoom.objects.filter(logistics_company=logistics_company, lot=lot).first()
        if existing_room:
            serializer = self.get_serializer(existing_room)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        # Proceed with normal creation
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        room = serializer.save()
        # Mocking an automated response from Logistics Company when a room is created
        self._generate_mock_logistics_response(room)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        room = self.get_object()
        user = request.user
        
        if getattr(user, 'role', None) == UserRole.ADMIN:
            room.messages.filter(is_from_logistics=False, read=False).update(read=True)
        else:
            room.messages.filter(is_from_logistics=True, read=False).update(read=True)
            
        return Response({"success": True})

    def _generate_mock_logistics_response(self, room):
        # 1. Welcome message
        ChatMessage.objects.create(
            room=room,
            is_from_logistics=True,
            text=f"Hello from {room.logistics_company.name}. We have received your lot {room.lot.lot_number}. We will provide a quote shortly."
        )
        
        # 2. Automated Quote
        price = random.randint(15000, 45000)
        eta = random.randint(12, 48)
        LotQuote.objects.create(
            room=room,
            price=price,
            estimated_delivery_hours=eta,
            number_of_vehicles=1,
            special_conditions="Standard terms apply. No hazardous materials.",
            status=QuoteStatus.PENDING
        )
        
        # 3. Notification Message
        ChatMessage.objects.create(
            room=room,
            is_from_logistics=True,
            text=f"We have generated a quote of ₹{price} for this load. Please review and accept to proceed."
        )


class ChatMessageViewSet(viewsets.ModelViewSet):
    """
    Individual messages within a chat room.
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', None) == UserRole.ADMIN:
            return ChatMessage.objects.filter(room__logistics_company__name=user.organization.name)
        return ChatMessage.objects.filter(room__factory__organization=user.organization)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class LotQuoteViewSet(viewsets.ModelViewSet):
    """
    Quotes submitted by Logistics Companies.
    """
    serializer_class = LotQuoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.ADMIN:
            return LotQuote.objects.filter(room__logistics_company__name=user.organization.name)
        return LotQuote.objects.filter(room__factory__organization=user.organization)

    @action(detail=True, methods=['post'], url_path='accept')
    def accept_quote(self, request, pk=None):
        quote = self.get_object()
        room = quote.room
        lot = room.lot

        if quote.status != QuoteStatus.PENDING:
            return Response({"success": False, "message": "Quote is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Update Quote and Lot Status
        quote.status = QuoteStatus.ACCEPTED
        quote.save()

        lot.status = LotStatus.SHIPMENT_GENERATED
        lot.assigned_logistics_company = room.logistics_company
        lot.save()

        # 2. Notify Chat
        ChatMessage.objects.create(
            room=room,
            sender=request.user,
            text=f"We have accepted your quote of ₹{quote.price}. Please prepare the vehicles."
        )

        ChatMessage.objects.create(
            room=room,
            is_from_logistics=True,
            text=f"Thank you! We will dispatch the vehicles as per the schedule."
        )

        # 3. Generate the Shipment
        from organizations.models import Organization
        logistics_org = Organization.objects.filter(name=room.logistics_company.name).first()

        shipment = Shipment.objects.create(
            factory=room.factory,
            destination_warehouse=lot.destination_warehouse,
            shipment_type=ShipmentType.FINISHED_GOODS,
            priority=ShipmentPriority.MEDIUM,
            status=ShipmentStatus.LOGISTICS_SELECTED,
            created_by=request.user,
            lot=lot,
            logistics_provider=logistics_org
        )

        ShipmentEvent.objects.create(
            shipment=shipment,
            event_type=ShipmentEventType.SHIPMENT_CREATED,
            description=f'Shipment auto-generated from Lot {lot.lot_number} via Logistics Partner {room.logistics_company.name}.',
            performed_by=request.user,
        )

        return Response({
            "success": True, 
            "message": "Quote accepted and Shipment generated successfully.",
            "shipment_id": shipment.id
        })

    @action(detail=True, methods=['post'], url_path='reject')
    def reject_quote(self, request, pk=None):
        quote = self.get_object()
        room = quote.room

        if quote.status != QuoteStatus.PENDING:
            return Response({"success": False, "message": "Quote is not pending."}, status=status.HTTP_400_BAD_REQUEST)

        quote.status = QuoteStatus.REJECTED
        quote.save()

        ChatMessage.objects.create(
            room=room,
            sender=request.user,
            text=f"We have declined your quote of ₹{quote.price}. Please provide a better offer."
        )

        return Response({"success": True, "message": "Quote rejected successfully."})
