"""
WebSocket URL routing for Django Channels.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/dashboard/$', consumers.DashboardConsumer.as_asgi()),
    re_path(r'^ws/chat/(?P<thread_id>\d+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'^ws/telemetry/$', consumers.TelemetryConsumer.as_asgi()),
]
