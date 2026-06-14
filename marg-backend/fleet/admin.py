from django.contrib import admin
from .models import Driver, Truck


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'license_number', 'is_available', 'created_at')
    list_filter = ('is_available', 'organization')
    search_fields = ('user__email', 'user__first_name', 'license_number')


@admin.register(Truck)
class TruckAdmin(admin.ModelAdmin):
    list_display = ('registration_number', 'organization', 'vehicle_type', 'status', 'assigned_driver')
    list_filter = ('status', 'organization')
    search_fields = ('registration_number',)
