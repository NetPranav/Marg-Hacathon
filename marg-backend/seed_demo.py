import os
import sys
import django
import random
from django.utils import timezone
from datetime import timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marg_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from common.enums import (
    OrganizationType, UserRole, WarehouseType, 
    ShipmentStatus, ShipmentPriority, ShipmentType, TruckStatus
)
from organizations.models import Organization
from factories.models import Factory
from warehouses.models import Warehouse, DockBay, Rack, Shelf
from logistics.models import LogisticsCompany
from fleet.models import Truck, Driver
from shipments.models import Shipment
from warehouses.models import Parcel

User = get_user_model()

def clear_existing():
    print("Clearing existing demo data...")
    emails = ["owner@demofactory.com", "manager@demowarehouse.com", "admin@demologistics.com", "driver1@demologistics.com", "driver2@demologistics.com"]
    User.objects.filter(email__in=emails).delete()
    Organization.objects.filter(name__in=["Demo Factory Inc", "Demo Warehouse Co", "Demo Logistics Ltd"]).delete()

def seed_demo_data():
    clear_existing()
    print("Creating Demo Environment...")

    # 1. Factory
    factory_org = Organization.objects.create(
        name="Demo Factory Inc", email="factory@demo.com", phone_number="1111111111", org_type=OrganizationType.FACTORY
    )
    factory_owner = User.objects.create_user(
        email="owner@demofactory.com", password="password123", first_name="Factory", last_name="Owner",
        phone_number="1111111112", role=UserRole.SUPER_ADMIN, organization=factory_org
    )
    factory = Factory.objects.create(
        organization=factory_org, name="Main Demo Factory", city="Mumbai", created_by=factory_owner
    )

    # 2. Warehouse
    warehouse_org = Organization.objects.create(
        name="Demo Warehouse Co", email="warehouse@demo.com", phone_number="2222222222", org_type=OrganizationType.WAREHOUSE
    )
    warehouse_manager = User.objects.create_user(
        email="manager@demowarehouse.com", password="password123", first_name="Warehouse", last_name="Manager",
        phone_number="2222222223", role=UserRole.WAREHOUSE_MANAGER, organization=warehouse_org
    )
    warehouse = Warehouse.objects.create(
        organization=warehouse_org, name="Central Hub", warehouse_type=WarehouseType.DISTRIBUTION_CENTER,
        capacity=10000, max_concurrent_trucks=10, city="Delhi", layout_width=100, layout_depth=100, layout_height=10
    )
    # Racks & Docks
    for i in range(3):
        DockBay.objects.create(warehouse=warehouse, dock_number=f"Dock-{i+1}", x_position=i*10, z_position=0)
    for i in range(5):
        rack = Rack.objects.create(warehouse=warehouse, rack_id=f"R-{i+1}", row_index=0, col_index=i, x_position=i*10, z_position=20)
        for j in range(4):
            Shelf.objects.create(rack=rack, level=j+1, max_weight=1000.0, available_volume=50.0)

    # 3. Logistics Company
    logistics_org = Organization.objects.create(
        name="Demo Logistics Ltd", email="logistics@demo.com", phone_number="3333333333", org_type=OrganizationType.LOGISTICS_PROVIDER
    )
    logistics_owner = User.objects.create_user(
        email="admin@demologistics.com", password="password123", first_name="Logistics", last_name="Admin",
        phone_number="3333333334", role=UserRole.ADMIN, organization=logistics_org
    )
    logistics_company = LogisticsCompany.objects.create(
        name="Demo Logistics Ltd", contact_email="logistics@demo.com", contact_phone="3333333333"
    )

    # 4. Drivers & Trucks
    drivers = []
    for i in range(2):
        d_user = User.objects.create_user(
            email=f"driver{i+1}@demologistics.com", password="password123", first_name="Driver", last_name=f"{i+1}",
            phone_number=f"444444444{i}", role=UserRole.DRIVER, organization=logistics_org
        )
        drivers.append(Driver.objects.create(user=d_user, organization=logistics_org, license_number=f"DL-00{i+1}"))

    trucks = []
    for i in range(3):
        trucks.append(Truck.objects.create(
            organization=logistics_org, registration_number=f"TRK-100{i}", capacity_kg=20000.0,
            volume_m3=50.0, status=TruckStatus.AVAILABLE
        ))

    # 5. Shipments (5 Shipments)
    print("Generating 5 Shipments with 20 Parcels total...")
    statuses = [
        ShipmentStatus.DRAFT,
        ShipmentStatus.WAREHOUSE_APPROVED,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.ARRIVED_AT_GATE,
        ShipmentStatus.SLOTTING_IN_PROGRESS
    ]

    for i, status in enumerate(statuses):
        shipment = Shipment.objects.create(
            factory=factory, destination_warehouse=warehouse, logistics_provider=logistics_org,
            created_by=factory_owner, status=status, shipment_type=ShipmentType.FINISHED_GOODS,
            priority=ShipmentPriority.HIGH, expected_arrival_time=timezone.now() + timedelta(days=2),
            assigned_truck=trucks[i % len(trucks)] if status in [ShipmentStatus.IN_TRANSIT, ShipmentStatus.ARRIVED_AT_GATE, ShipmentStatus.SLOTTING_IN_PROGRESS] else None,
            assigned_driver=drivers[i % len(drivers)] if status in [ShipmentStatus.IN_TRANSIT, ShipmentStatus.ARRIVED_AT_GATE, ShipmentStatus.SLOTTING_IN_PROGRESS] else None
        )
        # Create 4 parcels per shipment (Total 20)
        for j in range(4):
            Parcel.objects.create(
                parcel_id=f"P-{shipment.id}-{j+1}", warehouse=warehouse,
                weight=50.0, width=0.5, depth=0.5, height=0.5,
                destination="Demo Warehouse Co"
            )

    print("Demo dataset generation complete!")
    print("Logins for testing:")
    print("Factory: owner@demofactory.com / password123")
    print("Warehouse: manager@demowarehouse.com / password123")
    print("Logistics: admin@demologistics.com / password123")
    print("Driver: driver1@demologistics.com / password123")

if __name__ == '__main__':
    seed_demo_data()
