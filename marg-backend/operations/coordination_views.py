from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from shipments.models import Shipment
from operations.models import GateCheckIn, ExceptionReport, ShipmentEvent
from chat.models import ChatThread, ChatMessage
from common.enums import ShipmentEventType, ShipmentStatus, ChatMessageType
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def send_system_chat_message(shipment, content):
    thread, _ = ChatThread.objects.get_or_create(shipment=shipment)
    message = ChatMessage.objects.create(
        thread=thread,
        message_type=ChatMessageType.SYSTEM,
        content=content
    )
    thread.last_message_at = message.created_at
    thread.save()

    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'chat_{thread.id}',
        {
            'type': 'chat_message',
            'message': {
                'id': message.id,
                'thread': thread.id,
                'content': message.content,
                'message_type': message.message_type,
                'created_at': message.created_at.isoformat(),
                'sender': None,
            }
        }
    )


class DriverArrivalView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, shipment_id):
        shipment = get_object_or_404(Shipment, shipment_number=shipment_id)
        
        # 1. Update Shipment Status
        shipment.status = ShipmentStatus.ARRIVED_AT_GATE
        shipment.save()

        # 2. Record Event
        ShipmentEvent.objects.create(
            shipment=shipment,
            event_type=ShipmentEventType.ARRIVED,
            performed_by=request.user,
            description="Driver marked arrival at warehouse gate."
        )

        # 3. Create Pending Gate Check-in
        GateCheckIn.objects.get_or_create(
            shipment=shipment,
            defaults={'status': GateCheckIn.CheckInStatus.PENDING}
        )

        # 4. Notify Chat
        send_system_chat_message(shipment, f"Driver has arrived at the warehouse gate.")

        # 5. Broadcast to Dashboard
        channel_layer = get_channel_layer()
        if shipment.destination_warehouse and shipment.destination_warehouse.organization_id:
            org_id = shipment.destination_warehouse.organization_id
            async_to_sync(channel_layer.group_send)(
                f'warehouse_org_{org_id}',
                {
                    'type': 'shipment_update',
                    'shipment_id': shipment.shipment_number,
                    'status': shipment.status,
                    'action': 'DRIVER_ARRIVED'
                }
            )

        return Response({"status": "Arrival recorded"}, status=status.HTTP_200_OK)


class GateCheckInApprovalView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, shipment_id):
        shipment = get_object_or_404(Shipment, shipment_number=shipment_id)
        check_in = get_object_or_404(GateCheckIn, shipment=shipment)
        
        action = request.data.get('action', 'APPROVE') # APPROVE or REJECT
        
        if action == 'APPROVE':
            check_in.status = GateCheckIn.CheckInStatus.APPROVED
            check_in.verified_by = request.user
            check_in.save()
            
            ShipmentEvent.objects.create(
                shipment=shipment,
                event_type=ShipmentEventType.GATE_CHECK_IN,
                performed_by=request.user,
                description="Gate check-in approved."
            )
            send_system_chat_message(shipment, "Gate check-in approved. You may proceed to the dock.")
        else:
            check_in.status = GateCheckIn.CheckInStatus.REJECTED
            check_in.verified_by = request.user
            check_in.save()
            send_system_chat_message(shipment, "Gate check-in rejected. Please contact warehouse staff.")

        return Response({"status": check_in.status}, status=status.HTTP_200_OK)


class ExceptionReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, shipment_id):
        shipment = get_object_or_404(Shipment, shipment_number=shipment_id)
        
        exception = ExceptionReport.objects.create(
            shipment=shipment,
            reported_by=request.user,
            exception_type=request.data.get('exception_type'),
            description=request.data.get('description'),
        )
        
        ShipmentEvent.objects.create(
            shipment=shipment,
            event_type=ShipmentEventType.EXCEPTION_RAISED,
            performed_by=request.user,
            description=f"Exception: {exception.get_exception_type_display()}"
        )

        send_system_chat_message(shipment, f"EXCEPTION RAISED: {exception.get_exception_type_display()} - {exception.description}")

        return Response({"status": "Exception reported", "id": exception.id}, status=status.HTTP_201_CREATED)
