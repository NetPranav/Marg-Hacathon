from django.contrib import admin
from .models import Factory


@admin.register(Factory)
class FactoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'city', 'state', 'created_by', 'created_at')
    list_filter = ('organization', 'state')
    search_fields = ('name', 'city')
