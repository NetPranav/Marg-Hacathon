import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from factories.models import Factory
from warehouses.models import Warehouse

factory = Factory.objects.filter(name__icontains="Mumbai Plant").first()
if factory:
    factory.latitude = 19.0760
    factory.longitude = 72.8777
    factory.save()
    print("Updated Factory:", factory)

warehouse = Warehouse.objects.filter(name__icontains="Pranav").first()
if warehouse:
    warehouse.latitude = 22.9676
    warehouse.longitude = 76.0534
    warehouse.save()
    print("Updated Warehouse:", warehouse)

