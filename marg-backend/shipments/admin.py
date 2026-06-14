from django.contrib import admin
from .models import Shipment, Lot, LotParcel

@admin.register(Lot)
class LotAdmin(admin.ModelAdmin):
    list_display = ('lot_number', 'factory', 'destination_warehouse', 'status', 'created_at')
    list_filter = ('status', 'factory')
    search_fields = ('lot_number',)

@admin.register(LotParcel)
class LotParcelAdmin(admin.ModelAdmin):
    list_display = ('parcel_id', 'lot', 'dispatch_priority', 'weight', 'quantity')
    list_filter = ('dispatch_priority', 'is_fragile')
    search_fields = ('parcel_id', 'lot__lot_number')
@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = (
        'shipment_number', 'factory', 'destination_warehouse',
        'status', 'priority', 'assigned_truck', 'created_at',
    )
    list_filter = ('status', 'priority', 'shipment_type')
    search_fields = ('shipment_number',)
    readonly_fields = ('shipment_number',)
