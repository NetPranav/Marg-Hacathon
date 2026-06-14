from django.contrib import admin
from .models import ETAPrediction, DockRecommendation, ReturnLoad


@admin.register(ETAPrediction)
class ETAPredictionAdmin(admin.ModelAdmin):
    list_display = ('shipment', 'predicted_eta', 'confidence', 'delay_probability', 'generated_at')
    list_filter = ('generated_at',)
    search_fields = ('shipment__shipment_number',)


@admin.register(DockRecommendation)
class DockRecommendationAdmin(admin.ModelAdmin):
    list_display = ('warehouse', 'recommendation_type', 'status', 'created_at')
    list_filter = ('recommendation_type', 'status')


@admin.register(ReturnLoad)
class ReturnLoadAdmin(admin.ModelAdmin):
    list_display = ('truck', 'return_shipment', 'match_score', 'distance_to_pickup', 'status')
    list_filter = ('status',)
