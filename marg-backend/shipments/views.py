from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from common.enums import UserRole, ShipmentStatus, ShipmentEventType
from fleet.models import Truck, Driver
from warehouses.models import DockBay
from audit.services import get_client_ip
from operations.models import ShipmentEvent
from operations.serializers import (
    ShipmentEventSerializer,
    AssignTruckSerializer,
    AssignDriverSerializer,
    ReserveDockSerializer,
    CancelShipmentSerializer,
)
from operations.services.state_machine import (
    InvalidTransitionError, transition_shipment, get_valid_transitions,
)
from operations.services.truck_service import assign_truck, TruckAssignmentError
from operations.services.driver_service import assign_driver, DriverAssignmentError
from operations.services.dock_service import reserve_dock, DockReservationError
from operations.services.dispatch_service import (
    dispatch_shipment, ready_for_dispatch, DispatchError,
)
from operations.services.arrival_service import (
    mark_arrived, approve_gate_entry, start_unloading, complete_shipment, cancel_shipment, ArrivalError,
)

from .models import Shipment
from .serializers import ShipmentSerializer, ShipmentListSerializer, ShipmentCreateSerializer


@extend_schema_view(
    list=extend_schema(tags=['Shipments'], summary='List shipments'),
    create=extend_schema(tags=['Shipments'], summary='Create a shipment'),
    retrieve=extend_schema(tags=['Shipments'], summary='Get shipment detail'),
    partial_update=extend_schema(tags=['Shipments'], summary='Update a shipment'),
    destroy=extend_schema(tags=['Shipments'], summary='Delete a shipment'),
)
class ShipmentViewSet(viewsets.ModelViewSet):
    """
    Shipment management with full lifecycle action endpoints.

    - Super Admin: full CRUD on all shipments.
    - Factory Manager: create + view shipments from own organization's factories.
    - Warehouse Manager: view incoming shipments to own organization's warehouses.
    - Driver: view shipments assigned to them.
    """
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'create':
            return ShipmentCreateSerializer
        if self.action == 'list':
            return ShipmentListSerializer
        return ShipmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Shipment.objects.select_related(
            'factory', 'factory__organization',
            'destination_warehouse', 'destination_warehouse__organization',
            'assigned_truck', 'assigned_driver', 'assigned_driver__user',
            'created_by',
        )

        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        if user.role == UserRole.FACTORY_MANAGER:
            return qs.filter(factory__organization=user.organization)
        if user.role == UserRole.WAREHOUSE_MANAGER:
            return qs.filter(destination_warehouse__organization=user.organization)
        if user.role == UserRole.DRIVER:
            return qs.filter(assigned_driver__user=user)
        if user.role == UserRole.ADMIN:
            return qs.filter(logistics_provider=user.organization)
        return qs.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        # Re-fetch with select_related for full detail response
        shipment = Shipment.objects.select_related(
            'factory', 'destination_warehouse',
            'assigned_truck', 'assigned_driver',
            'created_by',
        ).get(pk=serializer.instance.pk)
        return Response(
            {
                'success': True,
                'message': 'Shipment created successfully.',
                'data': ShipmentSerializer(shipment).data,
            },
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        shipment = serializer.save(created_by=self.request.user)

        # Create initial timeline event
        ShipmentEvent.objects.create(
            shipment=shipment,
            event_type=ShipmentEventType.SHIPMENT_CREATED,
            description='Shipment created.',
            performed_by=self.request.user,
        )

        # Auto-transition to READY_FOR_ASSIGNMENT
        try:
            transition_shipment(shipment, ShipmentStatus.READY_FOR_ASSIGNMENT)
        except InvalidTransitionError:
            pass

    # ─── Action Endpoints ────────────────────────────────────────────────

    @extend_schema(
        tags=['Shipment Operations'],
        summary='Assign a truck to a shipment',
        request=AssignTruckSerializer,
    )
    @action(detail=True, methods=['post'], url_path='assign-truck')
    def assign_truck_action(self, request, pk=None):
        shipment = self.get_object()
        serializer = AssignTruckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            truck = Truck.objects.get(id=serializer.validated_data['truck_id'])
        except Truck.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Truck not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            assign_truck(shipment, truck, request.user, ip_address=get_client_ip(request))
        except (TruckAssignmentError, InvalidTransitionError) as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': f'Truck {truck.registration_number} assigned successfully.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(
        tags=['Shipment Operations'],
        summary='Assign a driver to a shipment',
        request=AssignDriverSerializer,
    )
    @action(detail=True, methods=['post'], url_path='assign-driver')
    def assign_driver_action(self, request, pk=None):
        shipment = self.get_object()
        serializer = AssignDriverSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            driver = Driver.objects.select_related('user').get(
                id=serializer.validated_data['driver_id']
            )
        except Driver.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Driver not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            assign_driver(shipment, driver, request.user, ip_address=get_client_ip(request))
        except (DriverAssignmentError, InvalidTransitionError) as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': f'Driver {driver.user.full_name} assigned successfully.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(
        tags=['Shipment Operations'],
        summary='Reserve a dock for a shipment',
        request=ReserveDockSerializer,
    )
    @action(detail=True, methods=['post'], url_path='reserve-dock')
    def reserve_dock_action(self, request, pk=None):
        shipment = self.get_object()
        serializer = ReserveDockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            dock = DockBay.objects.select_related('warehouse').get(
                id=serializer.validated_data['dock_id']
            )
        except DockBay.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Dock bay not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            shipment, reservation = reserve_dock(
                shipment, dock, request.user, ip_address=get_client_ip(request)
            )
        except (DockReservationError, InvalidTransitionError) as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': f'Dock {dock.dock_number} reserved successfully.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Approve warehouse request')
    @action(detail=True, methods=['post'], url_path='approve-warehouse')
    def approve_warehouse(self, request, pk=None):
        shipment = self.get_object()

        try:
            transition_shipment(shipment, ShipmentStatus.WAREHOUSE_APPROVED)
            send_system_chat_message(shipment, "Warehouse request approved.")
        except InvalidTransitionError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Warehouse request approved successfully.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Reject warehouse request')
    @action(detail=True, methods=['post'], url_path='reject-warehouse')
    def reject_warehouse(self, request, pk=None):
        shipment = self.get_object()

        try:
            transition_shipment(shipment, ShipmentStatus.CANCELLED)
            send_system_chat_message(shipment, "Warehouse request rejected.")
        except InvalidTransitionError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Warehouse request rejected.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Mark loading as complete')
    @action(detail=True, methods=['post'], url_path='mark-loading-complete')
    def mark_loading_complete_action(self, request, pk=None):
        shipment = self.get_object()

        try:
            ready_for_dispatch(shipment, request.user, ip_address=get_client_ip(request))
        except (DispatchError, InvalidTransitionError) as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Loading marked as complete.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Dispatch a shipment')
    @action(detail=True, methods=['post'], url_path='dispatch')
    def dispatch_action(self, request, pk=None):
        shipment = self.get_object()

        try:

            dispatch_shipment(shipment, request.user, ip_address=get_client_ip(request))
        except (DispatchError, InvalidTransitionError) as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Shipment dispatched successfully.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Mark shipment as arrived')
    @action(detail=True, methods=['post'], url_path='mark-arrived')
    def mark_arrived_action(self, request, pk=None):
        shipment = self.get_object()

        try:
            mark_arrived(shipment, request.user, ip_address=get_client_ip(request))
        except (ArrivalError, InvalidTransitionError) as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Arrival recorded successfully.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Approve gate entry')
    @action(detail=True, methods=['post'], url_path='approve-gate')
    def approve_gate_action(self, request, pk=None):
        shipment = self.get_object()

        try:
            approve_gate_entry(shipment, request.user, ip_address=get_client_ip(request))
        except ArrivalError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Gate entry approved. Dock is now occupied.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Start unloading')
    @action(detail=True, methods=['post'], url_path='start-unloading')
    def start_unloading_action(self, request, pk=None):
        shipment = self.get_object()

        try:
            start_unloading(shipment, request.user, ip_address=get_client_ip(request))
        except (ArrivalError, InvalidTransitionError) as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Unloading started.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Driver accepts cargo')
    @action(detail=True, methods=['post'], url_path='accept-cargo')
    def accept_cargo_action(self, request, pk=None):
        shipment = self.get_object()
        
        # We can implement a separate cargo acceptance if needed,
        # but for now we just log it as an event.
        ShipmentEvent.objects.create(
            shipment=shipment,
            event_type=ShipmentEventType.STATUS_CHANGED,
            description='Driver has confirmed cargo receipt (Shipment No, Seal, Parcels verified).',
            performed_by=request.user,
        )

        return Response({
            'success': True,
            'message': 'Cargo accepted.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Driver starts trip')
    @action(detail=True, methods=['post'], url_path='start-transit')
    def start_transit_action(self, request, pk=None):
        shipment = self.get_object()

        try:
            from operations.services.state_machine import transition_shipment
            # Fast-forward through intermediate states if needed
            if shipment.status == ShipmentStatus.DRIVER_ASSIGNED:
                transition_shipment(shipment, ShipmentStatus.READY_FOR_PICKUP)
            if shipment.status == ShipmentStatus.READY_FOR_PICKUP:
                transition_shipment(shipment, ShipmentStatus.LOADING_IN_PROGRESS)
            if shipment.status == ShipmentStatus.LOADING_IN_PROGRESS:
                transition_shipment(shipment, ShipmentStatus.READY_FOR_TRANSIT)
            if shipment.status == ShipmentStatus.READY_FOR_TRANSIT:
                transition_shipment(shipment, ShipmentStatus.IN_TRANSIT)
            
            # Record transit start time if we want to use actual_dispatch_time
            from django.utils import timezone
            shipment.actual_dispatch_time = timezone.now()
            shipment.save(update_fields=['actual_dispatch_time', 'updated_at'])

            # Update Truck status
            if shipment.assigned_truck:
                from common.enums import TruckStatus
                shipment.assigned_truck.status = TruckStatus.IN_TRANSIT
                shipment.assigned_truck.save(update_fields=['status', 'updated_at'])

            ShipmentEvent.objects.create(
                shipment=shipment,
                event_type=ShipmentEventType.DISPATCHED,
                description='Driver started the trip. Transit begun.',
                performed_by=request.user,
            )
        except InvalidTransitionError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Transit started successfully.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Complete a shipment')
    @action(detail=True, methods=['post'], url_path='complete')
    def complete_action(self, request, pk=None):
        shipment = self.get_object()

        try:
            complete_shipment(shipment, request.user, ip_address=get_client_ip(request))
        except (ArrivalError, InvalidTransitionError) as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Shipment completed successfully.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(
        tags=['Shipment Operations'],
        summary='Cancel a shipment',
        request=CancelShipmentSerializer,
    )
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_action(self, request, pk=None):
        shipment = self.get_object()
        serializer = CancelShipmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reason = serializer.validated_data.get('reason', '')

        try:
            cancel_shipment(shipment, request.user, reason=reason, ip_address=get_client_ip(request))
        except InvalidTransitionError as e:
            return Response(
                {'success': False, 'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({
            'success': True,
            'message': 'Shipment cancelled.',
            'data': ShipmentSerializer(shipment).data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Get shipment timeline')
    @action(detail=True, methods=['get'], url_path='timeline')
    def timeline(self, request, pk=None):
        shipment = self.get_object()
        events = ShipmentEvent.objects.filter(shipment=shipment).select_related('performed_by')
        serializer = ShipmentEventSerializer(events, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Get valid next transitions')
    @action(detail=True, methods=['get'], url_path='transitions')
    def valid_transitions(self, request, pk=None):
        shipment = self.get_object()
        transitions = get_valid_transitions(shipment.status)
        return Response({
            'success': True,
            'current_status': shipment.status,
            'valid_transitions': transitions,
        })

    @extend_schema(tags=['Shipment Operations'], summary='Get ETA prediction for a shipment')
    @action(detail=True, methods=['get'], url_path='eta')
    def eta(self, request, pk=None):
        from optimization.services.eta_service import calculate_eta, get_latest_eta
        from optimization.serializers import ETAPredictionSerializer

        shipment = self.get_object()
        # Try to get existing prediction or generate a new one
        prediction = get_latest_eta(shipment)
        if not prediction:
            prediction = calculate_eta(shipment)

        if not prediction:
            return Response({
                'success': False,
                'message': 'Insufficient telemetry data to generate ETA.',
            }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'success': True,
            'data': ETAPredictionSerializer(prediction).data,
        })


# ─── Phase 8: Lot Views ──────────────────────────────────────────────────

from .models import Lot, LotParcel
from .serializers import LotSerializer, LotCreateSerializer, LotParcelSerializer

@extend_schema_view(
    list=extend_schema(tags=['Lots'], summary='List lots'),
    create=extend_schema(tags=['Lots'], summary='Create a lot'),
    retrieve=extend_schema(tags=['Lots'], summary='Get lot detail'),
    partial_update=extend_schema(tags=['Lots'], summary='Update a lot'),
    destroy=extend_schema(tags=['Lots'], summary='Delete a lot'),
)
class LotViewSet(viewsets.ModelViewSet):
    """
    Manage Lots (collections of parcels) before they become Shipments.
    """
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'create':
            return LotCreateSerializer
        return LotSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Lot.objects.select_related(
            'factory', 'destination_warehouse', 'assigned_logistics_company'
        ).prefetch_related('parcels')

        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        if user.role == UserRole.FACTORY_MANAGER:
            return qs.filter(factory__organization=user.organization)
        if user.role == UserRole.ADMIN:
            return qs.exclude(status='ACCEPTED')
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='submit-quote')
    def submit_quote(self, request, pk=None):
        from logistics.models import ChatRoom, LotQuote, LogisticsCompany
        from common.enums import QuoteStatus
        
        lot = self.get_object()
        user = request.user
        
        # Ensure the user is a logistics admin
        if user.role != UserRole.ADMIN:
            return Response({'success': False, 'message': 'Only Logistics Admins can submit quotes.'}, status=status.HTTP_403_FORBIDDEN)
        
        # Find the logistics company
        company = LogisticsCompany.objects.filter(name=user.organization.name).first()
        if not company:
            # Create a LogisticsCompany entry if it doesn't exist
            company = LogisticsCompany.objects.create(
                name=user.organization.name,
                contact_email=user.email,
                contact_phone=user.phone_number or ''
            )
            
        # Get or create chat room
        room, created = ChatRoom.objects.get_or_create(
            factory=lot.factory,
            logistics_company=company,
            lot=lot
        )
        
        # Create the quote
        price = request.data.get('bid_amount', 0)
        estimated_hours = request.data.get('estimated_delivery_hours', 24)
        notes = request.data.get('notes', '')
        
        quote = LotQuote.objects.create(
            room=room,
            price=price,
            estimated_delivery_hours=estimated_hours,
            special_conditions=notes,
            status=QuoteStatus.PENDING
        )
        
        # Send a chat message
        from logistics.models import ChatMessage
        ChatMessage.objects.create(
            room=room,
            sender=user,
            is_from_logistics=True,
            text=f"We have submitted a quote of ₹{price} for this load. {notes}"
        )
        
        return Response({
            'success': True,
            'message': 'Quote submitted successfully.'
        })


@extend_schema_view(
    list=extend_schema(tags=['Lots'], summary='List parcels'),
    create=extend_schema(tags=['Lots'], summary='Create a parcel'),
    retrieve=extend_schema(tags=['Lots'], summary='Get parcel detail'),
    partial_update=extend_schema(tags=['Lots'], summary='Update a parcel'),
    destroy=extend_schema(tags=['Lots'], summary='Delete a parcel'),
)
class LotParcelViewSet(viewsets.ModelViewSet):
    serializer_class = LotParcelSerializer
    queryset = LotParcel.objects.all()
    http_method_names = ['get', 'post', 'patch', 'delete']
    filterset_fields = ['lot']
