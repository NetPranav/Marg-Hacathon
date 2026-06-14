"""
Celery application configuration for Marg.

This module configures the Celery app used for:
- Telemetry processing
- Dock optimization (every 5 min)
- Return-load matching (every 10 min)
- Delay detection (every 15 min)
"""
import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marg_backend.settings')

app = Celery('marg_backend')

# Load Celery config from Django settings, using CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all registered Django apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """A simple debug task for verifying Celery connectivity."""
    print(f'Request: {self.request!r}')
