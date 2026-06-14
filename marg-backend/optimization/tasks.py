"""
Celery tasks for real-time logistics intelligence.

Tasks:
- process_telemetry_point: On-demand, triggered per GPS ping
- optimize_docks_periodic: Every 5 minutes
- find_return_loads_periodic: Every 10 minutes
- detect_shipment_delays_periodic: Every 15 minutes
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='telemetry.process_telemetry_point')
def process_telemetry_point(telemetry_point_id):
    """
    Process a single telemetry point:
    1. Check geofences
    2. Update ETA
    3. Broadcast location to dashboards
    """
    from telemetry.models import TelemetryPoint
    from geofencing.services import check_geofence_entry, process_geofence_event
    from optimization.services.eta_service import calculate_eta
    from realtime.broadcast import broadcast_telemetry, broadcast_eta_update

    try:
        point = TelemetryPoint.objects.select_related(
            'driver', 'driver__user', 'driver__organization',
            'truck', 'shipment', 'shipment__destination_warehouse',
        ).get(id=telemetry_point_id)
    except TelemetryPoint.DoesNotExist:
        logger.warning(f'TelemetryPoint {telemetry_point_id} not found')
        return

    # 1. Geofence check
    if point.shipment:
        matches = check_geofence_entry(
            point.latitude, point.longitude, shipment=point.shipment
        )
        for geofence, distance in matches:
            process_geofence_event(
                shipment=point.shipment,
                geofence=geofence,
                distance_km=distance,
                performed_by=point.driver.user,
            )

    # 2. ETA update
    if point.shipment:
        eta = calculate_eta(point.shipment)
        if eta and point.driver.organization_id:
            broadcast_eta_update(
                organization_id=point.driver.organization_id,
                eta_data={
                    'shipment_id': point.shipment_id,
                    'shipment_number': point.shipment.shipment_number,
                    'predicted_eta': eta.predicted_eta.isoformat(),
                    'confidence': float(eta.confidence),
                    'delay_probability': float(eta.delay_probability),
                    'remaining_distance_km': float(eta.remaining_distance_km) if eta.remaining_distance_km else None,
                },
            )

    # 3. Broadcast location
    if point.driver.organization_id:
        broadcast_telemetry(
            organization_id=point.driver.organization_id,
            telemetry_data={
                'driver_id': point.driver_id,
                'driver_name': point.driver.user.full_name,
                'truck_id': point.truck_id,
                'truck_reg': point.truck.registration_number if point.truck else None,
                'shipment_id': point.shipment_id,
                'latitude': float(point.latitude),
                'longitude': float(point.longitude),
                'speed': float(point.speed),
                'heading': float(point.heading),
                'battery_level': point.battery_level,
                'recorded_at': point.recorded_at.isoformat(),
            },
        )

    logger.info(
        f'Processed telemetry #{point.id} for driver {point.driver_id}'
    )


@shared_task(name='optimization.optimize_docks')
def optimize_docks_periodic():
    """
    Periodic task: Run dock optimization for all warehouses.
    Generates swap, assignment, and delay recommendations.
    Frequency: every 5 minutes.
    """
    from optimization.services.dock_intelligence import optimize_all_warehouses

    recs = optimize_all_warehouses()
    logger.info(f'Dock optimization complete: {len(recs)} recommendation(s) generated.')
    return len(recs)


@shared_task(name='optimization.find_return_loads')
def find_return_loads_periodic():
    """
    Periodic task: Find return-load matches for available trucks.
    Frequency: every 10 minutes.
    """
    from optimization.services.return_load_service import find_all_return_loads

    matches = find_all_return_loads()
    logger.info(f'Return-load matching complete: {len(matches)} match(es) found.')
    return len(matches)


@shared_task(name='optimization.detect_delays')
def detect_shipment_delays_periodic():
    """
    Periodic task: Check for shipment delays and generate alerts.
    Frequency: every 15 minutes.
    """
    from django.utils import timezone
    from shipments.models import Shipment
    from common.enums import (
        ShipmentStatus, ShipmentEventType, NotificationType,
    )
    from optimization.models import ETAPrediction
    from operations.models import ShipmentEvent
    from notifications.services import notify_factory_managers, notify_warehouse_managers

    # Find in-transit shipments
    in_transit = Shipment.objects.filter(
        status=ShipmentStatus.IN_TRANSIT,
    ).select_related(
        'factory', 'factory__organization',
        'destination_warehouse', 'destination_warehouse__organization',
    )

    delay_count = 0
    for shipment in in_transit:
        eta = ETAPrediction.objects.filter(shipment=shipment).first()
        if not eta:
            continue

        if (
            shipment.expected_arrival_time
            and eta.predicted_eta > shipment.expected_arrival_time
            and eta.delay_probability > 0.4
        ):
            delay_count += 1

            # Check if we already alerted for this delay recently (last 30 min)
            recent_alert = ShipmentEvent.objects.filter(
                shipment=shipment,
                event_type=ShipmentEventType.DELAY_DETECTED,
                timestamp__gte=timezone.now() - timezone.timedelta(minutes=30),
            ).exists()

            if recent_alert:
                continue

            delay_minutes = int(
                (eta.predicted_eta - shipment.expected_arrival_time).total_seconds() / 60
            )

            ShipmentEvent.objects.create(
                shipment=shipment,
                event_type=ShipmentEventType.DELAY_DETECTED,
                description=(
                    f'Delay detected: estimated {delay_minutes} min late. '
                    f'Probability: {float(eta.delay_probability)*100:.0f}%.'
                ),
                metadata={
                    'delay_minutes': delay_minutes,
                    'delay_probability': float(eta.delay_probability),
                    'predicted_eta': eta.predicted_eta.isoformat(),
                },
            )

            notify_factory_managers(
                organization=shipment.factory.organization,
                title='Shipment Delay Detected',
                message=(
                    f'Shipment {shipment.shipment_number} is estimated to arrive '
                    f'{delay_minutes} minutes late.'
                ),
                notification_type=NotificationType.ALERT,
                shipment=shipment,
            )

            if shipment.destination_warehouse:
                notify_warehouse_managers(
                    organization=shipment.destination_warehouse.organization,
                    title='Incoming Shipment Delayed',
                    message=(
                        f'Shipment {shipment.shipment_number} delayed by ~{delay_minutes} min. '
                        f'Dock schedule may need adjustment.'
                    ),
                    notification_type=NotificationType.ALERT,
                    shipment=shipment,
                )

    logger.info(f'Delay detection complete: {delay_count} delay(s) found.')
    return delay_count
