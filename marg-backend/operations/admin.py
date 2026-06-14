from django.contrib import admin
from .models import ShipmentEvent, DockReservation


@admin.register(ShipmentEvent)
class ShipmentEventAdmin(admin.ModelAdmin):
    list_display = ('shipment', 'event_type', 'performed_by', 'created_at')
    list_filter = ('event_type',)
    search_fields = ('shipment__shipment_number',)
    readonly_fields = ('shipment', 'event_type', 'description', 'performed_by', 'metadata', 'created_at')

    def has_add_permission(self, request):
        return False  # Events are created programmatically only

    def has_change_permission(self, request, obj=None):
        return False  # Immutable

    def has_delete_permission(self, request, obj=None):
        return False  # Immutable


@admin.register(DockReservation)
class DockReservationAdmin(admin.ModelAdmin):
    list_display = ('shipment', 'dock', 'reservation_status', 'reserved_at', 'check_in_time', 'check_out_time')
    list_filter = ('reservation_status',)
    search_fields = ('shipment__shipment_number',)
