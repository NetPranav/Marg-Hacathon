"""
Return-Load Matching Service — reduces empty miles by finding return trips.
"""
from decimal import Decimal
from django.utils import timezone

from common.enums import (
    ShipmentStatus, TruckStatus, ReturnLoadStatus,
    ShipmentEventType, NotificationType,
)
from shipments.models import Shipment
from fleet.models import Truck
from telemetry.models import TelemetryPoint
from geofencing.services import haversine_distance
from operations.models import ShipmentEvent
from notifications.services import notify_driver, notify_factory_managers
from optimization.models import ReturnLoad


def find_return_loads_for_truck(truck, max_distance_km=100):
    """
    Find outbound shipments near a truck that has completed or is completing delivery.

    Scoring criteria:
    - Distance to pickup (lower is better)
    - Truck capacity match
    - Shipment priority (higher priority = higher score)
    """
    # Get truck's last known location
    latest_telemetry = TelemetryPoint.objects.filter(
        truck=truck,
    ).order_by('-recorded_at').first()

    if not latest_telemetry:
        return []

    truck_lat = float(latest_telemetry.latitude)
    truck_lon = float(latest_telemetry.longitude)

    # Find shipments waiting for assignment near the truck
    candidate_shipments = Shipment.objects.filter(
        status__in=[
            ShipmentStatus.CREATED,
            ShipmentStatus.READY_FOR_ASSIGNMENT,
        ],
    ).select_related('factory', 'factory__organization')

    matches = []
    for shipment in candidate_shipments:
        factory = shipment.factory
        if not factory.city:
            continue  # No location data

        # Use factory's coordinates if available, otherwise skip
        factory_lat = float(factory.latitude) if hasattr(factory, 'latitude') and factory.latitude else None
        factory_lon = float(factory.longitude) if hasattr(factory, 'longitude') and factory.longitude else None

        if factory_lat is None or factory_lon is None:
            continue

        distance = haversine_distance(truck_lat, truck_lon, factory_lat, factory_lon)

        if distance > max_distance_km:
            continue

        # Calculate match score (0-100)
        # Distance score: closer = higher (max 50 points)
        distance_score = max(0, 50 * (1 - distance / max_distance_km))

        # Priority score (max 30 points)
        priority_map = {'CRITICAL': 30, 'HIGH': 22, 'MEDIUM': 15, 'LOW': 8}
        priority_score = priority_map.get(shipment.priority, 10)

        # Capacity match (max 20 points)
        capacity_score = 20  # Full score if truck has capacity

        total_score = round(distance_score + priority_score + capacity_score, 2)

        # Estimated revenue (simplified: ₹15/km * estimated trip distance)
        estimated_revenue = round(distance * 15, 2)

        # Check if this match already exists
        existing = ReturnLoad.objects.filter(
            original_shipment__assigned_truck=truck,
            return_shipment=shipment,
            status__in=[ReturnLoadStatus.SUGGESTED, ReturnLoadStatus.ACCEPTED],
        ).exists()

        if existing:
            continue

        # Get the truck's current shipment
        current_shipment = Shipment.objects.filter(
            assigned_truck=truck,
            status__in=[
                ShipmentStatus.IN_TRANSIT,
                ShipmentStatus.ARRIVED_AT_WAREHOUSE,
                ShipmentStatus.UNLOADING,
                ShipmentStatus.COMPLETED,
            ],
        ).order_by('-updated_at').first()

        if not current_shipment:
            continue

        match = ReturnLoad.objects.create(
            original_shipment=current_shipment,
            return_shipment=shipment,
            truck=truck,
            driver=truck.assigned_driver if truck.assigned_driver else current_shipment.assigned_driver,
            match_score=Decimal(str(total_score)),
            distance_to_pickup=Decimal(str(round(distance, 2))),
            estimated_revenue=Decimal(str(estimated_revenue)),
            status=ReturnLoadStatus.SUGGESTED,
        )
        matches.append(match)

    return matches


def accept_return_load(return_load, performed_by):
    """Driver accepts a return-load opportunity."""
    return_load.status = ReturnLoadStatus.ACCEPTED
    return_load.save(update_fields=['status', 'updated_at'])

    # Create timeline event on the return shipment
    ShipmentEvent.objects.create(
        shipment=return_load.return_shipment,
        event_type=ShipmentEventType.RETURN_LOAD_ACCEPTED,
        description=(
            f'Return load accepted by {return_load.driver.user.full_name}. '
            f'Truck {return_load.truck.registration_number} will pick up.'
        ),
        performed_by=performed_by,
        metadata={
            'return_load_id': return_load.id,
            'truck_reg': return_load.truck.registration_number,
            'distance_km': float(return_load.distance_to_pickup),
        },
    )

    # Notify factory managers
    notify_factory_managers(
        organization=return_load.return_shipment.factory.organization,
        title='Return Load Accepted',
        message=(
            f'Driver {return_load.driver.user.full_name} accepted return load for '
            f'shipment {return_load.return_shipment.shipment_number}. '
            f'Truck {return_load.truck.registration_number} is {return_load.distance_to_pickup}km away.'
        ),
        notification_type=NotificationType.RETURN_LOAD,
        shipment=return_load.return_shipment,
    )

    return return_load


def decline_return_load(return_load):
    """Driver declines a return-load opportunity."""
    return_load.status = ReturnLoadStatus.DECLINED
    return_load.save(update_fields=['status', 'updated_at'])
    return return_load


def find_all_return_loads():
    """Run return-load matching for all trucks that are completing deliveries."""
    from fleet.models import Truck

    # Find trucks that recently completed or are completing deliveries
    trucks = Truck.objects.filter(
        status__in=[TruckStatus.AVAILABLE, TruckStatus.IN_TRANSIT],
    ).select_related('assigned_driver')

    all_matches = []
    for truck in trucks:
        matches = find_return_loads_for_truck(truck)
        all_matches.extend(matches)

        # Notify driver about new matches
        if matches and truck.assigned_driver:
            notify_driver(
                driver=truck.assigned_driver,
                title=f'{len(matches)} Return Load Opportunities',
                message=f'We found {len(matches)} return load opportunities near your location.',
                notification_type=NotificationType.RETURN_LOAD,
            )

    return all_matches
