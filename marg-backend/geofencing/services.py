"""
Geofence detection service using the Haversine formula.
No PostGIS required — works with any database backend.
"""
import math
from decimal import Decimal

from common.enums import ShipmentEventType, NotificationType
from operations.models import ShipmentEvent
from notifications.services import notify_warehouse_managers
from .models import Geofence


# Earth's mean radius in km
EARTH_RADIUS_KM = 6371.0


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points on Earth
    using the Haversine formula.

    Args:
        lat1, lon1: Coordinates of point 1 (in decimal degrees)
        lat2, lon2: Coordinates of point 2 (in decimal degrees)

    Returns:
        Distance in kilometers.
    """
    lat1, lon1, lat2, lon2 = map(
        lambda x: math.radians(float(x)), [lat1, lon1, lat2, lon2]
    )

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))

    return EARTH_RADIUS_KM * c


def check_geofence_entry(latitude, longitude, shipment=None):
    """
    Check if a GPS point falls within any active geofence.

    Returns a list of (geofence, distance_km) tuples for all matched fences.
    """
    active_fences = Geofence.objects.filter(is_active=True).select_related(
        'warehouse', 'warehouse__organization',
        'factory', 'factory__organization',
    )

    # If shipment provided, only check the destination warehouse geofences
    if shipment and shipment.destination_warehouse:
        active_fences = active_fences.filter(
            warehouse=shipment.destination_warehouse
        )

    matches = []
    for fence in active_fences:
        distance = haversine_distance(
            latitude, longitude,
            fence.latitude, fence.longitude,
        )
        if distance <= float(fence.radius_km):
            matches.append((fence, round(distance, 2)))

    return matches


def process_geofence_event(shipment, geofence, distance_km, performed_by):
    """
    Handle a geofence entry event — create timeline event and notify.
    """
    target = geofence.warehouse or geofence.factory
    target_name = target.name if target else geofence.name

    # Create timeline event
    ShipmentEvent.objects.create(
        shipment=shipment,
        event_type=ShipmentEventType.GEOFENCE_ENTERED,
        description=f'Truck entered geofence: {geofence.name} ({distance_km}km from {target_name}).',
        performed_by=performed_by,
        metadata={
            'geofence_id': geofence.id,
            'geofence_name': geofence.name,
            'distance_km': distance_km,
            'radius_km': float(geofence.radius_km),
        },
    )

    # Notify warehouse managers if approaching a warehouse
    if geofence.warehouse:
        notify_warehouse_managers(
            organization=geofence.warehouse.organization,
            title='Truck Approaching',
            message=(
                f'Shipment {shipment.shipment_number} is {distance_km}km away from '
                f'{geofence.warehouse.name}. ETA will be updated shortly.'
            ),
            notification_type=NotificationType.GEOFENCE,
            shipment=shipment,
        )
