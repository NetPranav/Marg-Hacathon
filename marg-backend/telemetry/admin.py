from django.contrib import admin
from .models import TelemetryPoint


@admin.register(TelemetryPoint)
class TelemetryPointAdmin(admin.ModelAdmin):
    list_display = ('driver', 'truck', 'shipment', 'latitude', 'longitude', 'speed', 'recorded_at')
    list_filter = ('recorded_at',)
    search_fields = ('driver__user__email', 'truck__registration_number')
    readonly_fields = ('driver', 'truck', 'shipment', 'latitude', 'longitude', 'speed', 'heading', 'battery_level', 'recorded_at')
