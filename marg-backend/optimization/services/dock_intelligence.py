"""
Dock Intelligence Service — detects conflicts and generates optimization recommendations.
"""
from django.utils import timezone
from common.enums import (
    ShipmentStatus, DockStatus, ReservationStatus,
    RecommendationType, RecommendationStatus,
    NotificationType,
)
from operations.models import DockReservation
from warehouses.models import DockBay, Warehouse
from optimization.models import DockRecommendation, ETAPrediction
from notifications.services import notify_warehouse_managers


def detect_dock_conflicts(warehouse):
    """
    Analyze a warehouse's dock utilization and generate recommendations:
    - DOCK_SWAP: Truck A delayed, Truck B arriving early → suggest swap
    - DOCK_ASSIGNMENT: Dock available, incoming shipment needs one
    - DELAY_ALERT: Detention risk detected
    """
    recommendations = []

    # Get active reservations for this warehouse
    active_reservations = DockReservation.objects.filter(
        dock__warehouse=warehouse,
        reservation_status=ReservationStatus.ACTIVE,
    ).select_related('shipment', 'dock')

    # Get incoming shipments without dock reservations
    from shipments.models import Shipment
    incoming_no_dock = Shipment.objects.filter(
        destination_warehouse=warehouse,
        status__in=[
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.ARRIVED_AT_WAREHOUSE,
            ShipmentStatus.WAITING_FOR_DOCK,
        ],
    ).exclude(
        dock_reservations__reservation_status=ReservationStatus.ACTIVE,
    )

    # Check available docks
    available_docks = DockBay.objects.filter(
        warehouse=warehouse,
        status=DockStatus.AVAILABLE,
    )

    # 1. DOCK_ASSIGNMENT: Available dock + incoming shipment without dock
    for shipment in incoming_no_dock:
        if available_docks.exists():
            rec = DockRecommendation.objects.create(
                warehouse=warehouse,
                recommendation_type=RecommendationType.DOCK_ASSIGNMENT,
                affected_shipments=[shipment.id],
                reason=(
                    f'Shipment {shipment.shipment_number} is incoming but has no dock assigned. '
                    f'{available_docks.count()} dock(s) available.'
                ),
            )
            recommendations.append(rec)

    # 2. DELAY_ALERT: Reservations with delayed shipments
    for reservation in active_reservations:
        shipment = reservation.shipment
        eta = ETAPrediction.objects.filter(shipment=shipment).first()

        if eta and eta.delay_probability > 0.5:
            rec = DockRecommendation.objects.create(
                warehouse=warehouse,
                recommendation_type=RecommendationType.DELAY_ALERT,
                affected_shipments=[shipment.id],
                reason=(
                    f'Shipment {shipment.shipment_number} at Dock {reservation.dock.dock_number} '
                    f'has {float(eta.delay_probability)*100:.0f}% delay probability. '
                    f'Detention risk detected.'
                ),
            )
            recommendations.append(rec)

    # 3. DOCK_SWAP: Check for swap opportunities between delayed and early arrivals
    for reservation in active_reservations:
        shipment_a = reservation.shipment
        eta_a = ETAPrediction.objects.filter(shipment=shipment_a).first()
        if not eta_a or eta_a.delay_probability < 0.3:
            continue

        # Find a shipment arriving sooner that could use this dock
        for other_reservation in active_reservations.exclude(id=reservation.id):
            shipment_b = other_reservation.shipment
            eta_b = ETAPrediction.objects.filter(shipment=shipment_b).first()

            if eta_b and eta_b.predicted_eta < (eta_a.predicted_eta if eta_a else timezone.now()):
                rec = DockRecommendation.objects.create(
                    warehouse=warehouse,
                    recommendation_type=RecommendationType.DOCK_SWAP,
                    affected_shipments=[shipment_a.id, shipment_b.id],
                    reason=(
                        f'Swap suggested: {shipment_a.shipment_number} (delayed) at '
                        f'Dock {reservation.dock.dock_number} with '
                        f'{shipment_b.shipment_number} (arriving sooner) at '
                        f'Dock {other_reservation.dock.dock_number}.'
                    ),
                )
                recommendations.append(rec)

    # Notify if recommendations were generated
    if recommendations:
        notify_warehouse_managers(
            organization=warehouse.organization,
            title=f'{len(recommendations)} Dock Recommendation(s)',
            message=f'{len(recommendations)} new dock optimization recommendations for {warehouse.name}.',
            notification_type=NotificationType.DOCK,
        )

    return recommendations


def optimize_all_warehouses():
    """Run dock optimization for all warehouses."""
    all_recs = []
    for warehouse in Warehouse.objects.filter(dock_bays__isnull=False).distinct():
        recs = detect_dock_conflicts(warehouse)
        all_recs.extend(recs)
    return all_recs
