from django.contrib import admin
from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone_number', 'gst_number', 'city', 'state')
    search_fields = ('name', 'email', 'gst_number')
    list_filter = ('state',)
