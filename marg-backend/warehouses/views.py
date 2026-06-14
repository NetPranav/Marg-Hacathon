from django.db.models import Count, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework.permissions import IsAuthenticated, AllowAny

from common.enums import UserRole, ParcelStatus
from .models import Warehouse, DockBay, Rack, Shelf, Parcel
from common.enums import UserRole, ParcelStatus, OrganizationType
from .serializers import (
    WarehouseSerializer,
    WarehouseListSerializer,
    WarehouseDetailSerializer,
    DockBaySerializer,
    RackSerializer,
    RackListSerializer,
    ShelfSerializer,
    ParcelSerializer,
    ParcelCreateSerializer,
    WarehouseLayoutSerializer,
    SlotRecommendRequestSerializer,
    SlotRecommendResponseSerializer,
    SlotAssignRequestSerializer,
    ManualOverrideRequestSerializer,
)
from .services.slotting import recommend_shelf, assign_parcel, manual_override


# ─── Existing ViewSets ───────────────────────────────────────────────────────


@extend_schema_view(
    list=extend_schema(tags=['Warehouses'], summary='List warehouses'),
    create=extend_schema(tags=['Warehouses'], summary='Create a warehouse'),
    retrieve=extend_schema(tags=['Warehouses'], summary='Get warehouse detail'),
    partial_update=extend_schema(tags=['Warehouses'], summary='Update a warehouse'),
    destroy=extend_schema(tags=['Warehouses'], summary='Delete a warehouse'),
)
class WarehouseViewSet(viewsets.ModelViewSet):
    """
    Warehouse management.

    - Super Admin: full CRUD on all warehouses.
    - Warehouse Manager: full CRUD on own organization's warehouses.
    - Others: read-only access to own organization's warehouses.
    """
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_serializer_class(self):
        if self.action == 'list':
            return WarehouseListSerializer
        if self.action == 'retrieve':
            return WarehouseDetailSerializer
        return WarehouseSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Warehouse.objects.select_related('organization').prefetch_related('dock_bays')
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        return qs.filter(organization=user.organization)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != UserRole.SUPER_ADMIN:
            serializer.save(organization=user.organization)
        else:
            serializer.save()


@extend_schema_view(
    list=extend_schema(tags=['Warehouses'], summary='Search global warehouse registry'),
    retrieve=extend_schema(tags=['Warehouses'], summary='Get global warehouse detail'),
)
class GlobalWarehouseRegistryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Ecosystem-wide Global Warehouse Discovery.
    Factories and Logistics Providers use this to find destination warehouses.
    """
    serializer_class = WarehouseDetailSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['city', 'state', 'warehouse_type']
    search_fields = ['name', 'city', 'state']

    def get_queryset(self):
        # All warehouses globally are discoverable
        qs = Warehouse.objects.select_related('organization').prefetch_related('dock_bays')
        
        # Optional: Filter by capacity availability
        min_capacity = self.request.query_params.get('min_capacity')
        if min_capacity:
            # For simplicity, filtering by raw capacity field for now.
            # In a real system, we might annotate available volume.
            qs = qs.filter(capacity__gte=min_capacity)
            
        return qs


@extend_schema_view(
    list=extend_schema(tags=['Docks'], summary='List dock bays'),
    create=extend_schema(tags=['Docks'], summary='Create a dock bay'),
    retrieve=extend_schema(tags=['Docks'], summary='Get dock bay detail'),
    partial_update=extend_schema(tags=['Docks'], summary='Update a dock bay'),
    destroy=extend_schema(tags=['Docks'], summary='Delete a dock bay'),
)
class DockBayViewSet(viewsets.ModelViewSet):
    """
    Dock Bay management.

    - Super Admin: full CRUD on all docks.
    - Warehouse Manager: full CRUD on docks in own organization's warehouses.
    - Others: read-only access.
    """
    serializer_class = DockBaySerializer
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        user = self.request.user
        qs = DockBay.objects.select_related('warehouse', 'warehouse__organization')
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        return qs.filter(warehouse__organization=user.organization)


# ─── Phase 7: Slotting ViewSets ──────────────────────────────────────────────


@extend_schema_view(
    list=extend_schema(tags=['Slotting'], summary='List racks'),
    create=extend_schema(tags=['Slotting'], summary='Create a rack'),
    retrieve=extend_schema(tags=['Slotting'], summary='Get rack detail'),
    partial_update=extend_schema(tags=['Slotting'], summary='Update a rack'),
    destroy=extend_schema(tags=['Slotting'], summary='Delete a rack'),
)
class RackViewSet(viewsets.ModelViewSet):
    """Rack management within a warehouse."""
    http_method_names = ['get', 'post', 'patch', 'delete']
    filterset_fields = ['warehouse']

    def get_serializer_class(self):
        if self.action == 'list':
            return RackListSerializer
        return RackSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Rack.objects.select_related('warehouse').prefetch_related(
            'shelves', 'shelves__parcels',
        ).annotate(shelf_count_ann=Count('shelves'))
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        return qs.filter(warehouse__organization=user.organization)


@extend_schema_view(
    list=extend_schema(tags=['Slotting'], summary='List shelves'),
    retrieve=extend_schema(tags=['Slotting'], summary='Get shelf detail'),
    partial_update=extend_schema(tags=['Slotting'], summary='Update shelf (lock/reserve)'),
)
class ShelfViewSet(viewsets.ModelViewSet):
    """
    Shelf management. Primarily read-only with lock/reserve actions.
    """
    serializer_class = ShelfSerializer
    http_method_names = ['get', 'patch']
    filterset_fields = ['rack', 'rack__warehouse', 'is_locked', 'is_reserved']

    def get_queryset(self):
        user = self.request.user
        qs = Shelf.objects.select_related('rack', 'rack__warehouse').annotate(
            parcel_count=Count('parcels', filter=Q(
                parcels__status=ParcelStatus.STORED
            ))
        )
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        return qs.filter(rack__warehouse__organization=user.organization)


@extend_schema_view(
    list=extend_schema(tags=['Slotting'], summary='List parcels'),
    create=extend_schema(tags=['Slotting'], summary='Create a parcel'),
    retrieve=extend_schema(tags=['Slotting'], summary='Get parcel detail'),
    partial_update=extend_schema(tags=['Slotting'], summary='Update a parcel'),
)
class ParcelViewSet(viewsets.ModelViewSet):
    """
    Parcel management with search and filtering.
    """
    http_method_names = ['get', 'post', 'patch']
    filterset_fields = ['warehouse', 'status', 'priority', 'destination']
    search_fields = ['parcel_id', 'destination']
    ordering_fields = ['expected_dispatch_date', 'created_at', 'priority']

    def get_serializer_class(self):
        if self.action == 'create':
            return ParcelCreateSerializer
        return ParcelSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Parcel.objects.select_related(
            'shelf', 'shelf__rack', 'warehouse',
        )
        if user.role == UserRole.SUPER_ADMIN:
            return qs.all()
        return qs.filter(warehouse__organization=user.organization)


# ─── Layout & Slotting API Views ─────────────────────────────────────────────


@extend_schema(tags=['Slotting'], summary='Get full warehouse layout')
class WarehouseLayoutView(APIView):
    permission_classes = [IsAuthenticated]
    """
    GET: Full warehouse layout with racks, shelves, gates, and utilization.
    PATCH: Update warehouse dimensions.
    """

    def get(self, request):
        warehouse_id = request.query_params.get('warehouse')
        if not warehouse_id:
            # Default: first warehouse for this user's org
            user = request.user
            if user.role == UserRole.SUPER_ADMIN:
                wh = Warehouse.objects.first()
            else:
                wh = Warehouse.objects.filter(
                    organization=user.organization
                ).first()
        else:
            wh = Warehouse.objects.filter(id=warehouse_id).first()

        if not wh:
            # Auto-initialize a default warehouse for seamless demo/testing
            from organizations.models import Organization
            user = request.user
            org = getattr(user, 'organization', None)
            if not org:
                org = Organization.objects.first()
                if not org:
                    org = Organization.objects.create(name="Default Org")
            wh = Warehouse.objects.create(name="Main Hub", organization=org)

            # Setup generic layout automatically
            w, d, h = 50, 30, 6
            wh.width = w
            wh.depth = d
            wh.height = h
            wh.save()

            DockBay.objects.create(warehouse=wh, dock_number="D-01", dock_type="LOADING", x_position=-15, z_position=-d/2 + 1)
            DockBay.objects.create(warehouse=wh, dock_number="D-02", dock_type="UNLOADING", x_position=0, z_position=-d/2 + 1)
            DockBay.objects.create(warehouse=wh, dock_number="D-03", dock_type="LOADING", x_position=15, z_position=-d/2 + 1)

            rack_id_counter = 1
            for row in range(4):
                for col in range(6):
                    x = -w/2 + 5 + col * 8
                    z = -d/2 + 8 + row * 6
                    rack = Rack.objects.create(
                        warehouse=wh, rack_id=f"R-{rack_id_counter:02d}",
                        x_position=x, z_position=z,
                        shelf_width=2.5, shelf_depth=1.2, shelf_height=1.5,
                        num_shelves=4
                    )
                    for level in range(1, 5):
                        Shelf.objects.create(rack=rack, level=level)
                    rack_id_counter += 1

        serializer = WarehouseLayoutSerializer(wh)
        return Response(serializer.data)

    def patch(self, request):
        warehouse_id = request.data.get('id') or request.query_params.get('warehouse')
        try:
            wh = Warehouse.objects.get(id=warehouse_id)
        except Warehouse.DoesNotExist:
            return Response(
                {'detail': 'Warehouse not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        for field in ('width', 'depth', 'height'):
            if field in request.data:
                setattr(wh, field, request.data[field])

        wh.layout_version += 1
        wh.save()
        serializer = WarehouseLayoutSerializer(wh)
        return Response(serializer.data)

    def post(self, request):
        # This is for the setup wizard /init/
        # It wipes the layout and builds a new one based on rows, columns, etc.
        warehouse = Warehouse.objects.first()
        if not warehouse:
            # Fallback if no warehouse exists, get the first org
            from organizations.models import Organization
            org = Organization.objects.first()
            if not org:
                org = Organization.objects.create(name="Default Org")
            warehouse = Warehouse.objects.create(name="Main Hub", organization=org)
            
        data = request.data
        w = data.get('width', 50)
        d = data.get('depth', 30)
        h = data.get('height', 6)
        rows = data.get('rows', 4)
        cols = data.get('columns', 6)
        shelves_per_rack = data.get('shelves_per_rack', 4)

        warehouse.width = w
        warehouse.depth = d
        warehouse.height = h
        warehouse.save()

        # Wipe existing racks/docks for a fresh setup
        warehouse.racks.all().delete()
        warehouse.dock_bays.all().delete()

        # Add generic docks
        DockBay.objects.create(warehouse=warehouse, dock_number="D-01", dock_type="LOADING", x_position=-15, z_position=-d/2 + 1)
        DockBay.objects.create(warehouse=warehouse, dock_number="D-02", dock_type="UNLOADING", x_position=0, z_position=-d/2 + 1)
        DockBay.objects.create(warehouse=warehouse, dock_number="D-03", dock_type="LOADING", x_position=15, z_position=-d/2 + 1)

        rack_id_counter = 1
        for row in range(rows):
            for col in range(cols):
                x = -w/2 + 5 + col * 8
                z = -d/2 + 8 + row * 6
                
                rack = Rack.objects.create(
                    warehouse=warehouse,
                    rack_id=f"R-{rack_id_counter:02d}",
                    x_position=x,
                    z_position=z,
                    shelf_width=2.5,
                    shelf_depth=1.2,
                    shelf_height=1.5,
                    num_shelves=shelves_per_rack
                )
                
                for level in range(1, shelves_per_rack + 1):
                    Shelf.objects.create(rack=rack, level=level)
                
                rack_id_counter += 1

        return Response({"status": "initialized"})


@extend_schema(
    tags=['Slotting'],
    summary='Get shelf recommendations for a parcel',
    request=SlotRecommendRequestSerializer,
    responses=SlotRecommendResponseSerializer(many=True),
)
class SlotRecommendView(APIView):
    """POST: Get top-5 shelf recommendations for a parcel."""

    def post(self, request):
        ser = SlotRecommendRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            warehouse = Warehouse.objects.get(id=ser.validated_data['warehouse'])
        except Warehouse.DoesNotExist:
            return Response(
                {'detail': 'Warehouse not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        recommendations = recommend_shelf(ser.validated_data, warehouse)

        if not recommendations:
            return Response(
                {'detail': 'No suitable shelves found. All shelves may be full or locked.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(recommendations)


@extend_schema(
    tags=['Slotting'],
    summary='Assign a parcel to a shelf',
    request=SlotAssignRequestSerializer,
)
class SlotAssignView(APIView):
    """POST: Assign a parcel to a specific shelf."""

    def post(self, request):
        ser = SlotAssignRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            parcel = Parcel.objects.get(
                parcel_id=ser.validated_data['parcel_id'],
            )
        except Parcel.DoesNotExist:
            return Response(
                {'detail': 'Parcel not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            shelf = Shelf.objects.get(id=ser.validated_data['shelf_id'])
        except Shelf.DoesNotExist:
            return Response(
                {'detail': 'Shelf not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            updated_parcel = assign_parcel(parcel, shelf)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(ParcelSerializer(updated_parcel).data)


@extend_schema(
    tags=['Slotting'],
    summary='Manual override – move parcel to different shelf',
    request=ManualOverrideRequestSerializer,
)
class ManualOverrideView(APIView):
    """PATCH: Move a parcel to a different shelf (manual override)."""

    def patch(self, request):
        ser = ManualOverrideRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            parcel = Parcel.objects.select_related(
                'shelf', 'shelf__rack',
            ).get(parcel_id=ser.validated_data['parcel_id'])
        except Parcel.DoesNotExist:
            return Response(
                {'detail': 'Parcel not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            target_shelf = Shelf.objects.select_related('rack').get(
                id=ser.validated_data['target_shelf_id'],
            )
        except Shelf.DoesNotExist:
            return Response(
                {'detail': 'Target shelf not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = manual_override(
            parcel, target_shelf,
            validate=ser.validated_data.get('validate', True),
        )
        return Response(result)
