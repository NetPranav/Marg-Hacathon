from rest_framework import serializers
from .models import Shipment


class ShipmentSerializer(serializers.ModelSerializer):
    """Full detail serializer for Shipment."""
    factory_name = serializers.SerializerMethodField()

    def get_factory_name(self, obj):
        fac = obj.factory
        if fac:
            return f"{fac.name} ({fac.city})" if fac.city else fac.name
        return None
    warehouse_name = serializers.SerializerMethodField()

    def get_warehouse_name(self, obj):
        wh = obj.destination_warehouse
        if wh:
            return f"{wh.name} ({wh.city})" if wh.city else wh.name
        return None
    truck_reg = serializers.CharField(
        source='assigned_truck.registration_number', read_only=True, default=None
    )
    driver_name = serializers.CharField(
        source='assigned_driver.user.full_name', read_only=True, default=None
    )
    assigned_dock = serializers.SerializerMethodField()

    def get_assigned_dock(self, obj):
        from operations.models import DockReservation
        res = DockReservation.objects.filter(shipment=obj, reservation_status__in=['ACTIVE', 'UPCOMING']).first()
        if res and res.dock:
            return {'id': res.dock.id, 'name': res.dock.dock_number}
        return None
    created_by_name = serializers.CharField(
        source='created_by.full_name', read_only=True, default=None
    )

    class Meta:
        model = Shipment
        fields = (
            'id', 'shipment_number',
            'factory', 'factory_name',
            'destination_warehouse', 'warehouse_name',
            'assigned_truck', 'truck_reg',
            'assigned_driver', 'driver_name',
            'shipment_type', 'priority', 'status',
            'expected_dispatch_time', 'expected_arrival_time',
            'actual_dispatch_time', 'actual_arrival_time',
            'created_by', 'created_by_name',
            'created_at', 'updated_at', 'assigned_dock'
        )
        read_only_fields = (
            'id', 'shipment_number', 'created_by', 'created_at', 'updated_at',
        )


class ShipmentListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer for Shipment tables."""
    factory_name = serializers.SerializerMethodField()

    def get_factory_name(self, obj):
        fac = obj.factory
        if fac:
            return f"{fac.name} ({fac.city})" if fac.city else fac.name
        return None
    warehouse_name = serializers.SerializerMethodField()
    truck_reg = serializers.CharField(source='assigned_truck.registration_number', read_only=True, default=None)
    driver_name = serializers.CharField(source='assigned_driver.user.full_name', read_only=True, default=None)
    driver_phone = serializers.CharField(source='assigned_driver.user.phone_number', read_only=True, default=None)
    
    origin_lat = serializers.DecimalField(source='factory.latitude', max_digits=9, decimal_places=6, read_only=True)
    origin_lng = serializers.DecimalField(source='factory.longitude', max_digits=9, decimal_places=6, read_only=True)
    dest_lat = serializers.DecimalField(source='destination_warehouse.latitude', max_digits=9, decimal_places=6, read_only=True)
    dest_lng = serializers.DecimalField(source='destination_warehouse.longitude', max_digits=9, decimal_places=6, read_only=True)

    def get_warehouse_name(self, obj):
        wh = obj.destination_warehouse
        if wh:
            return f"{wh.name} ({wh.city})" if wh.city else wh.name
        return None

    estimated_revenue = serializers.SerializerMethodField()
    total_weight_kg = serializers.SerializerMethodField()
    eta = serializers.SerializerMethodField()
    assigned_dock = serializers.SerializerMethodField()

    def get_assigned_dock(self, obj):
        from operations.models import DockReservation
        res = DockReservation.objects.filter(shipment=obj, reservation_status__in=['ACTIVE', 'UPCOMING']).first()
        if res and res.dock:
            return {'id': res.dock.id, 'name': res.dock.dock_number}
        return None

    def get_estimated_revenue(self, obj):
        if hasattr(obj, 'lot') and obj.lot:
            from logistics.models import LotQuote
            from common.enums import QuoteStatus
            quote = LotQuote.objects.filter(room__lot=obj.lot, status=QuoteStatus.ACCEPTED).first()
            if quote:
                return quote.price
        return None

    def get_total_weight_kg(self, obj):
        if hasattr(obj, 'lot') and obj.lot:
            return sum([p.weight * p.quantity for p in obj.lot.parcels.all()])
        return None

    def get_eta(self, obj):
        if hasattr(obj, 'lot') and obj.lot:
            from logistics.models import LotQuote
            from common.enums import QuoteStatus
            quote = LotQuote.objects.filter(room__lot=obj.lot, status=QuoteStatus.ACCEPTED).first()
            if quote:
                return f"{quote.estimated_delivery_hours} hrs"
        return None

    class Meta:
        model = Shipment
        fields = (
            'id', 'shipment_number',
            'factory_name', 'warehouse_name',
            'shipment_type', 'priority', 'status',
            'expected_arrival_time', 'created_at', 'total_distance_km',
            'truck_reg', 'driver_name', 'driver_phone',
            'estimated_revenue', 'total_weight_kg', 'eta',
            'origin_lat', 'origin_lng', 'dest_lat', 'dest_lng',
            'assigned_dock'
        )


class ShipmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new shipment."""

    class Meta:
        model = Shipment
        fields = (
            'factory', 'destination_warehouse',
            'assigned_truck', 'assigned_driver',
            'shipment_type', 'priority',
            'expected_dispatch_time', 'expected_arrival_time', 'lot'
        )

# ─── Phase 8: Lot Serializers ───────────────────────────────────────────────

from .models import Lot, LotParcel

class LotParcelSerializer(serializers.ModelSerializer):
    class Meta:
        model = LotParcel
        fields = '__all__'
        read_only_fields = ('id', 'lot', 'created_at', 'updated_at')


class LotSerializer(serializers.ModelSerializer):
    parcels = LotParcelSerializer(many=True, read_only=True)
    factory_name = serializers.SerializerMethodField()

    def get_factory_name(self, obj):
        fac = obj.factory
        if fac:
            return f"{fac.name} ({fac.city})" if fac.city else fac.name
        return None
    destination_name = serializers.SerializerMethodField()
    assigned_logistics_name = serializers.CharField(source='assigned_logistics_company.name', read_only=True, default=None)
    total_weight = serializers.SerializerMethodField()

    def get_destination_name(self, obj):
        wh = obj.destination_warehouse
        if wh:
            return f"{wh.name} ({wh.city})" if wh.city else wh.name
        return None
    
    def get_total_weight(self, obj):
        return sum([p.weight * p.quantity for p in obj.parcels.all()])
    
    class Meta:
        model = Lot
        fields = '__all__'
        read_only_fields = ('id', 'lot_number', 'created_by', 'created_at', 'updated_at')

class LotCreateSerializer(serializers.ModelSerializer):
    parcels = LotParcelSerializer(many=True, required=False)

    class Meta:
        model = Lot
        fields = ('factory', 'destination_warehouse', 'status', 'expected_dispatch_date', 'parcels')

    def create(self, validated_data):
        parcels_data = validated_data.pop('parcels', [])
        lot = Lot.objects.create(**validated_data)
        for parcel_data in parcels_data:
            LotParcel.objects.create(lot=lot, **parcel_data)
        return lot
