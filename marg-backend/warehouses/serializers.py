from rest_framework import serializers
from .models import Warehouse, DockBay, Rack, Shelf, Parcel


# ─── Existing Serializers ────────────────────────────────────────────────────


class DockBaySerializer(serializers.ModelSerializer):
    """Full CRUD serializer for DockBay."""
    warehouse_name = serializers.CharField(
        source='warehouse.name', read_only=True
    )

    class Meta:
        model = DockBay
        fields = (
            'id', 'warehouse', 'warehouse_name',
            'dock_number', 'status', 'dock_type',
            'x_position', 'z_position',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class WarehouseSerializer(serializers.ModelSerializer):
    """Full CRUD serializer for Warehouse."""
    organization_name = serializers.CharField(
        source='organization.name', read_only=True
    )
    dock_count = serializers.IntegerField(
        source='dock_bays.count', read_only=True
    )

    class Meta:
        model = Warehouse
        fields = (
            'id', 'organization', 'organization_name', 'name',
            'address', 'city', 'state', 'country',
            'latitude', 'longitude', 'capacity',
            'width', 'depth', 'height', 'layout_version',
            'dock_count', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class WarehouseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns."""
    class Meta:
        model = Warehouse
        fields = ('id', 'name', 'city', 'state', 'organization')


class WarehouseDetailSerializer(WarehouseSerializer):
    """Warehouse detail with nested dock bays."""
    dock_bays = DockBaySerializer(many=True, read_only=True)

    class Meta(WarehouseSerializer.Meta):
        fields = WarehouseSerializer.Meta.fields + ('dock_bays',)

# ─── Phase 7: Slotting Serializers ───────────────────────────────────────────


class ShelfSerializer(serializers.ModelSerializer):
    """Serializer for a single shelf."""
    rack_id = serializers.CharField(source='rack.rack_id', read_only=True)
    utilization = serializers.FloatField(read_only=True)
    total_volume = serializers.FloatField(read_only=True)
    parcel_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Shelf
        fields = (
            'id', 'rack', 'rack_id', 'level',
            'available_volume', 'occupied_volume',
            'total_volume', 'utilization', 'parcel_count',
            'max_weight', 'current_weight',
            'is_locked', 'is_reserved',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'available_volume', 'occupied_volume',
            'current_weight', 'created_at', 'updated_at',
        )

    def get_fields(self):
        fields = super().get_fields()
        # Annotated field may not always be present
        return fields


class RackSerializer(serializers.ModelSerializer):
    """Serializer for a rack with its shelves."""
    shelves = ShelfSerializer(many=True, read_only=True)

    class Meta:
        model = Rack
        fields = (
            'id', 'warehouse', 'rack_id',
            'row_index', 'col_index',
            'x_position', 'z_position',
            'num_shelves', 'shelf_width', 'shelf_depth', 'shelf_height',
            'shelves', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class RackListSerializer(serializers.ModelSerializer):
    """Lightweight rack list serializer."""
    shelf_count = serializers.IntegerField(source='shelves.count', read_only=True)

    class Meta:
        model = Rack
        fields = (
            'id', 'rack_id', 'row_index', 'col_index',
            'x_position', 'z_position', 'num_shelves', 'shelf_count',
        )


class ParcelSerializer(serializers.ModelSerializer):
    """Full parcel serializer."""
    shelf_level = serializers.IntegerField(source='shelf.level', read_only=True)
    rack_id = serializers.CharField(source='shelf.rack.rack_id', read_only=True, default=None)
    rack_db_id = serializers.IntegerField(source='shelf.rack.id', read_only=True, default=None)
    volume = serializers.FloatField(read_only=True)

    class Meta:
        model = Parcel
        fields = (
            'id', 'parcel_id', 'warehouse', 'shelf',
            'shelf_level', 'rack_id', 'rack_db_id',
            'height', 'width', 'depth', 'weight', 'volume',
            'destination', 'expected_dispatch_date',
            'priority', 'special_handling',
            'position_label', 'status', 'color',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'position_label', 'status',
            'created_at', 'updated_at',
        )


class ParcelCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new parcel."""

    class Meta:
        model = Parcel
        fields = (
            'parcel_id', 'warehouse',
            'height', 'width', 'depth', 'weight',
            'destination', 'expected_dispatch_date',
            'priority', 'special_handling',
        )


# ─── Layout Serializers ─────────────────────────────────────────────────────


class WarehouseLayoutSerializer(serializers.Serializer):
    """Full warehouse layout with racks, shelves, and gates."""
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    width = serializers.DecimalField(max_digits=8, decimal_places=2)
    depth = serializers.DecimalField(max_digits=8, decimal_places=2)
    height = serializers.DecimalField(max_digits=8, decimal_places=2)
    layout_version = serializers.IntegerField(read_only=True)
    racks = RackSerializer(many=True, read_only=True)
    dock_bays = DockBaySerializer(many=True, read_only=True)
    utilization = serializers.SerializerMethodField()

    def get_utilization(self, obj):
        shelves = Shelf.objects.filter(rack__warehouse=obj)
        total_vol = sum(s.total_volume for s in shelves)
        used_vol = sum(float(s.occupied_volume) for s in shelves)
        return {
            'total_volume': round(total_vol, 2),
            'occupied_volume': round(used_vol, 2),
            'utilization_pct': round(
                (used_vol / total_vol * 100) if total_vol > 0 else 0, 1
            ),
            'rack_count': obj.racks.count(),
            'shelf_count': shelves.count(),
            'parcel_count': Parcel.objects.filter(
                warehouse=obj, status='STORED',
            ).count(),
        }


# ─── Slotting Request/Response ───────────────────────────────────────────────


class SlotRecommendRequestSerializer(serializers.Serializer):
    """Input for slotting recommendation."""
    warehouse = serializers.IntegerField()
    height = serializers.DecimalField(max_digits=6, decimal_places=2)
    width = serializers.DecimalField(max_digits=6, decimal_places=2)
    depth = serializers.DecimalField(max_digits=6, decimal_places=2)
    weight = serializers.DecimalField(max_digits=8, decimal_places=2)
    destination = serializers.CharField(max_length=255)
    expected_dispatch_date = serializers.DateField()
    priority = serializers.ChoiceField(
        choices=['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default='MEDIUM',
    )


class SlotRecommendResponseSerializer(serializers.Serializer):
    """Output of slotting recommendation."""
    shelf_id = serializers.IntegerField()
    rack_id = serializers.CharField()
    rack_db_id = serializers.IntegerField()
    shelf_level = serializers.IntegerField()
    score = serializers.FloatField()
    breakdown = serializers.DictField()
    available_volume = serializers.FloatField()
    current_utilization = serializers.FloatField()
    warnings = serializers.ListField(child=serializers.CharField())


class SlotAssignRequestSerializer(serializers.Serializer):
    """Input for assigning a parcel to a shelf."""
    parcel_id = serializers.CharField(max_length=30)
    shelf_id = serializers.IntegerField()


class ManualOverrideRequestSerializer(serializers.Serializer):
    """Input for manual parcel move."""
    parcel_id = serializers.CharField(max_length=30)
    target_shelf_id = serializers.IntegerField()
    validate = serializers.BooleanField(default=True)
