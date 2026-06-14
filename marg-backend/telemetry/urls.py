from django.urls import path
from .views import TelemetryIngestView, TelemetryLatestView, TelemetryHistoryView

urlpatterns = [
    path('', TelemetryIngestView.as_view(), name='telemetry-ingest'),
    path('latest/', TelemetryLatestView.as_view(), name='telemetry-latest'),
    path('history/', TelemetryHistoryView.as_view(), name='telemetry-history'),
]
