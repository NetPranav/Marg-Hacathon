"""
ETA Prediction Service — estimates arrival times from telemetry data.
"""
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

from geofencing.services import haversine_distance
from telemetry.models import TelemetryPoint
from optimization.models import ETAPrediction


def calculate_eta(shipment):
    """
    Calculate the predicted ETA for a shipment based on:
    - Last known GPS position
    - Average speed from recent telemetry
    - Distance remaining to destination warehouse

    Returns the created ETAPrediction or None if insufficient data.
    """
    warehouse = shipment.destination_warehouse
    if not warehouse or not warehouse.latitude or not warehouse.longitude:
        return None

    # Get the most recent telemetry for this shipment's driver
    latest = TelemetryPoint.objects.filter(
        shipment=shipment,
    ).order_by('-recorded_at').first()

    if not latest:
        return None

    # Calculate remaining distance
    remaining_km = haversine_distance(
        latest.latitude, latest.longitude,
        warehouse.latitude, warehouse.longitude,
    )

    # Calculate average speed from last 10 points
    recent_points = TelemetryPoint.objects.filter(
        shipment=shipment,
    ).order_by('-recorded_at')[:10]

    speeds = [float(pt.speed) for pt in recent_points if pt.speed > 0]
    avg_speed = sum(speeds) / len(speeds) if speeds else 40.0  # Default 40 km/h

    # Prevent division by zero
    if avg_speed < 1:
        avg_speed = 40.0

    # Estimate time remaining
    hours_remaining = remaining_km / avg_speed
    predicted_eta = timezone.now() + timedelta(hours=hours_remaining)

    # Confidence: higher when closer and more data points
    data_points = len(speeds)
    confidence = min(0.95, 0.5 + (data_points * 0.05))

    # Delay probability: compare with expected arrival
    delay_probability = Decimal('0.00')
    if shipment.expected_arrival_time:
        if predicted_eta > shipment.expected_arrival_time:
            # The later the predicted ETA vs expected, the higher the probability
            delay_minutes = (predicted_eta - shipment.expected_arrival_time).total_seconds() / 60
            delay_probability = min(Decimal('1.00'), Decimal(str(round(delay_minutes / 120, 2))))

    # Create prediction
    prediction = ETAPrediction.objects.create(
        shipment=shipment,
        predicted_eta=predicted_eta,
        confidence=Decimal(str(round(confidence, 2))),
        delay_probability=delay_probability,
        remaining_distance_km=Decimal(str(round(remaining_km, 2))),
    )

    return prediction


def get_latest_eta(shipment):
    """Get the most recent ETA prediction for a shipment."""
    return ETAPrediction.objects.filter(shipment=shipment).first()
