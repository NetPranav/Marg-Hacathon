from django.urls import path
from .views import AnalyticsOverviewView, FleetAnalyticsView, IntelligenceInsightsView

urlpatterns = [
    path('overview/', AnalyticsOverviewView.as_view(), name='analytics-overview'),
    path('fleet/', FleetAnalyticsView.as_view(), name='analytics-fleet'),
    path('insights/', IntelligenceInsightsView.as_view(), name='analytics-insights'),
]
