from django.contrib import admin
from .models import Geofence


@admin.register(Geofence)
class GeofenceAdmin(admin.ModelAdmin):
    list_display = ('name', 'warehouse', 'factory', 'radius_km', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name',)
