from django.contrib import admin
from .models import Warehouse, DockBay, Rack, Shelf, Parcel


class DockBayInline(admin.TabularInline):
    model = DockBay
    extra = 1


class ShelfInline(admin.TabularInline):
    model = Shelf
    extra = 0
    readonly_fields = ('available_volume',)


class ParcelInline(admin.TabularInline):
    model = Parcel
    extra = 0
    fields = ('parcel_id', 'destination', 'status', 'position_label')
    readonly_fields = ('position_label',)


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'city', 'state', 'capacity', 'width', 'depth', 'height', 'layout_version', 'created_at')
    list_filter = ('organization', 'state')
    search_fields = ('name', 'city')
    inlines = [DockBayInline]


@admin.register(DockBay)
class DockBayAdmin(admin.ModelAdmin):
    list_display = ('dock_number', 'warehouse', 'status', 'dock_type', 'x_position', 'z_position')
    list_filter = ('status', 'dock_type', 'warehouse')


@admin.register(Rack)
class RackAdmin(admin.ModelAdmin):
    list_display = ('rack_id', 'warehouse', 'row_index', 'col_index', 'num_shelves')
    list_filter = ('warehouse',)
    search_fields = ('rack_id',)
    inlines = [ShelfInline]


@admin.register(Shelf)
class ShelfAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'level', 'available_volume', 'occupied_volume', 'is_locked', 'is_reserved')
    list_filter = ('is_locked', 'is_reserved', 'rack__warehouse')
    inlines = [ParcelInline]


@admin.register(Parcel)
class ParcelAdmin(admin.ModelAdmin):
    list_display = ('parcel_id', 'warehouse', 'destination', 'status', 'priority', 'expected_dispatch_date', 'shelf', 'position_label')
    list_filter = ('status', 'priority', 'warehouse')
    search_fields = ('parcel_id', 'destination')

