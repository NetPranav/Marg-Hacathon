"""
Smart Warehouse Slotting Engine.

Determines the optimal shelf position for each incoming parcel based on:
- Space fit & utilization efficiency
- Dispatch priority (sooner → closer to gate)
- Destination clustering
- Weight distribution
- Accessibility scoring

Usage:
    from warehouses.services.slotting import recommend_shelf, assign_parcel

    recommendations = recommend_shelf(parcel, warehouse)
    parcel = assign_parcel(parcel, shelf)
"""
import math
from datetime import date
from decimal import Decimal
from django.db.models import Q, Count
from warehouses.models import Shelf, Parcel, DockBay
from common.enums import ParcelStatus


# ─── Score Weights ───────────────────────────────────────────────────────────

WEIGHT_SPACE_UTILIZATION = 0.40
WEIGHT_DISPATCH_PRIORITY = 0.20
WEIGHT_DESTINATION_GROUP = 0.15
WEIGHT_ACCESSIBILITY = 0.15
WEIGHT_DISTRIBUTION = 0.10


# ─── Core Algorithm ─────────────────────────────────────────────────────────


def recommend_shelf(parcel_data: dict, warehouse) -> list[dict]:
    """
    Given parcel dimensions and a warehouse, return a ranked list of
    shelf recommendations with composite scores.

    Args:
        parcel_data: dict with keys height, width, depth, weight,
                     destination, expected_dispatch_date, priority
        warehouse: Warehouse model instance

    Returns:
        List of dicts: [{ shelf, score, breakdown, warnings }, ...]
        Ordered by score descending. Max 5 results.
    """
    parcel_volume = (
        float(parcel_data['height'])
        * float(parcel_data['width'])
        * float(parcel_data['depth'])
    )
    parcel_weight = float(parcel_data['weight'])
    destination = parcel_data.get('destination', '')
    dispatch_date = parcel_data.get('expected_dispatch_date')
    priority = parcel_data.get('priority', 'MEDIUM')

    if isinstance(dispatch_date, str):
        dispatch_date = date.fromisoformat(dispatch_date)

    # 1. Find all shelves in this warehouse
    shelves = Shelf.objects.filter(
        rack__warehouse=warehouse,
    ).select_related('rack').prefetch_related('parcels')

    # 2. Get gate positions for distance calculation
    gates = DockBay.objects.filter(
        warehouse=warehouse,
        x_position__isnull=False,
        z_position__isnull=False,
    )
    gate_positions = [
        (float(g.x_position), float(g.z_position)) for g in gates
    ]

    # If no gates have positions, use warehouse entrance (center-front)
    if not gate_positions:
        w = float(warehouse.width or 40)
        d = float(warehouse.depth or 30)
        gate_positions = [(0, d / 2)]

    # 3. Get destination grouping data
    dest_shelf_counts = {}
    if destination:
        dest_parcels = Parcel.objects.filter(
            warehouse=warehouse,
            destination__iexact=destination,
            status=ParcelStatus.STORED,
        ).values_list('shelf__rack_id', flat=True)
        for rack_id in dest_parcels:
            if rack_id:
                dest_shelf_counts[rack_id] = dest_shelf_counts.get(rack_id, 0) + 1

    # 4. Score each shelf
    candidates = []
    for shelf in shelves:
        # Skip locked/reserved shelves
        if shelf.is_locked or shelf.is_reserved:
            continue

        # Space fit check
        available = float(shelf.available_volume)
        if parcel_volume > available:
            continue

        # Weight check
        remaining_weight = float(shelf.max_weight) - float(shelf.current_weight)
        if parcel_weight > remaining_weight:
            continue

        # Calculate individual scores
        space_score = _space_utilization_score(shelf, parcel_volume)
        dispatch_score = _dispatch_priority_score(
            shelf, gate_positions, dispatch_date, priority
        )
        dest_score = _destination_grouping_score(shelf, dest_shelf_counts)
        access_score = _accessibility_score(shelf)
        weight_score = _weight_distribution_score(shelf, parcel_weight)

        # Composite score
        composite = (
            space_score * WEIGHT_SPACE_UTILIZATION
            + dispatch_score * WEIGHT_DISPATCH_PRIORITY
            + dest_score * WEIGHT_DESTINATION_GROUP
            + access_score * WEIGHT_ACCESSIBILITY
            + weight_score * WEIGHT_DISTRIBUTION
        )

        # Warnings
        warnings = []
        utilization_after = (float(shelf.occupied_volume) + parcel_volume) / shelf.total_volume
        if utilization_after > 0.9:
            warnings.append('Shelf will be >90% full after placement.')
        weight_ratio = (float(shelf.current_weight) + parcel_weight) / float(shelf.max_weight)
        if weight_ratio > 0.85:
            warnings.append('Shelf will be >85% of weight capacity.')

        candidates.append({
            'shelf_id': shelf.id,
            'rack_id': shelf.rack.rack_id,
            'rack_db_id': shelf.rack.id,
            'shelf_level': shelf.level,
            'score': round(composite, 4),
            'breakdown': {
                'space_utilization': round(space_score, 4),
                'dispatch_priority': round(dispatch_score, 4),
                'destination_grouping': round(dest_score, 4),
                'accessibility': round(access_score, 4),
                'weight_distribution': round(weight_score, 4),
            },
            'available_volume': round(available, 2),
            'current_utilization': round(shelf.utilization * 100, 1),
            'warnings': warnings,
        })

    # Sort by composite score descending
    candidates.sort(key=lambda c: c['score'], reverse=True)
    return candidates[:5]


def assign_parcel(parcel: Parcel, shelf: Shelf) -> Parcel:
    """
    Assign a parcel to a shelf. Updates shelf volumes and parcel status.

    Args:
        parcel: Parcel model instance (status=PENDING)
        shelf: Shelf model instance

    Returns:
        Updated Parcel instance.

    Raises:
        ValueError: If parcel doesn't fit or constraints violated.
    """
    parcel_vol = parcel.volume

    # Validate fit
    if parcel_vol > float(shelf.available_volume):
        raise ValueError(
            f"Parcel volume ({parcel_vol:.2f}m³) exceeds available "
            f"shelf space ({float(shelf.available_volume):.2f}m³)."
        )

    if parcel.weight > (shelf.max_weight - shelf.current_weight):
        raise ValueError(
            f"Parcel weight ({parcel.weight}kg) exceeds remaining "
            f"shelf capacity ({shelf.max_weight - shelf.current_weight}kg)."
        )

    # Update shelf
    shelf.occupied_volume = Decimal(str(float(shelf.occupied_volume) + parcel_vol))
    shelf.current_weight = Decimal(str(float(shelf.current_weight) + float(parcel.weight)))
    shelf.save()

    # Update parcel
    parcel.shelf = shelf
    parcel.status = ParcelStatus.STORED
    # Auto-generate position label
    existing_count = Parcel.objects.filter(
        shelf=shelf, status=ParcelStatus.STORED,
    ).exclude(pk=parcel.pk).count()
    row = chr(65 + (existing_count // 3))  # A, B, C, ...
    col = (existing_count % 3) + 1
    parcel.position_label = f"{row}{col}"
    parcel.save()

    return parcel


def manual_override(parcel: Parcel, target_shelf: Shelf, validate: bool = True) -> dict:
    """
    Move a parcel to a different shelf (manual override).

    Args:
        parcel: Parcel to move (must be STORED).
        target_shelf: Destination shelf.
        validate: If True, check constraints and return warnings.

    Returns:
        Dict with 'success', 'warnings', 'parcel'.
    """
    warnings = []

    if validate:
        # Check fit
        parcel_vol = parcel.volume
        if parcel_vol > float(target_shelf.available_volume):
            warnings.append(
                f"Parcel volume ({parcel_vol:.2f}m³) exceeds available "
                f"shelf space ({float(target_shelf.available_volume):.2f}m³)."
            )

        remaining_weight = float(target_shelf.max_weight) - float(target_shelf.current_weight)
        if float(parcel.weight) > remaining_weight:
            warnings.append(
                f"Parcel weight ({parcel.weight}kg) exceeds remaining "
                f"shelf capacity ({remaining_weight:.1f}kg)."
            )

        if target_shelf.is_locked:
            warnings.append('Target shelf is locked.')

        # Check dispatch efficiency
        old_shelf = parcel.shelf
        if old_shelf:
            old_rack = old_shelf.rack
            new_rack = target_shelf.rack
            old_gate_dist = _min_gate_distance(
                old_rack, _get_gate_positions(parcel.warehouse)
            )
            new_gate_dist = _min_gate_distance(
                new_rack, _get_gate_positions(parcel.warehouse)
            )
            if new_gate_dist > old_gate_dist * 1.5:
                warnings.append(
                    'Moving to this shelf significantly increases distance from gate.'
                )

    # Perform the move
    old_shelf = parcel.shelf
    if old_shelf:
        old_shelf.occupied_volume = max(
            Decimal('0'),
            old_shelf.occupied_volume - Decimal(str(parcel.volume))
        )
        old_shelf.current_weight = max(
            Decimal('0'),
            old_shelf.current_weight - parcel.weight
        )
        old_shelf.save()

    # Place on new shelf
    target_shelf.occupied_volume += Decimal(str(parcel.volume))
    target_shelf.current_weight += parcel.weight
    target_shelf.save()

    parcel.shelf = target_shelf
    existing_count = Parcel.objects.filter(
        shelf=target_shelf, status=ParcelStatus.STORED,
    ).exclude(pk=parcel.pk).count()
    row = chr(65 + (existing_count // 3))
    col = (existing_count % 3) + 1
    parcel.position_label = f"{row}{col}"
    parcel.save()

    return {
        'success': True,
        'warnings': warnings,
        'parcel_id': parcel.parcel_id,
        'new_shelf': f"L{target_shelf.level} on {target_shelf.rack.rack_id}",
    }


# ─── Score Functions ─────────────────────────────────────────────────────────


def _space_utilization_score(shelf: Shelf, parcel_volume: float) -> float:
    """
    Higher score for shelves where the parcel fills remaining space efficiently.
    Ideal: parcel fills ~70-90% of remaining space.
    """
    available = float(shelf.available_volume)
    if available == 0:
        return 0

    fill_ratio = parcel_volume / available
    # Bell curve around 0.7 (70% fill is ideal)
    return math.exp(-((fill_ratio - 0.7) ** 2) / 0.18)


def _dispatch_priority_score(
    shelf: Shelf,
    gate_positions: list[tuple],
    dispatch_date,
    priority: str,
) -> float:
    """
    Higher score when:
    - Parcel dispatches sooner → shelf is closer to gate
    - Higher priority → stronger bias toward gate proximity
    """
    rack = shelf.rack
    rack_pos = (float(rack.x_position), float(rack.z_position))

    # Min distance to any gate
    min_dist = min(
        math.sqrt((rack_pos[0] - gx) ** 2 + (rack_pos[1] - gz) ** 2)
        for gx, gz in gate_positions
    ) if gate_positions else 10.0

    # Normalize distance (assume max ~50m warehouse diagonal)
    dist_score = max(0, 1.0 - (min_dist / 50.0))

    # Days until dispatch
    if dispatch_date:
        days_until = max((dispatch_date - date.today()).days, 0)
        urgency = max(0, 1.0 - (days_until / 30.0))  # Within 30 days is urgent
    else:
        urgency = 0.5

    # Priority multiplier
    priority_mult = {'LOW': 0.6, 'MEDIUM': 0.8, 'HIGH': 1.0, 'CRITICAL': 1.2}
    mult = priority_mult.get(priority, 0.8)

    return dist_score * urgency * mult


def _destination_grouping_score(shelf: Shelf, dest_rack_counts: dict) -> float:
    """
    Higher score if this rack already has parcels going to the same destination.
    """
    rack_id = shelf.rack.id
    count = dest_rack_counts.get(rack_id, 0)
    if count == 0:
        return 0.3  # Baseline for empty racks
    # Diminishing returns: log scale
    return min(1.0, 0.4 + 0.2 * math.log(1 + count))


def _accessibility_score(shelf: Shelf) -> float:
    """
    Lower shelves are more accessible.
    Level 1 (bottom) = 1.0, higher levels decrease.
    """
    level = shelf.level
    num_shelves = shelf.rack.num_shelves
    if num_shelves <= 1:
        return 1.0
    return 1.0 - ((level - 1) / num_shelves) * 0.6


def _weight_distribution_score(shelf: Shelf, parcel_weight: float) -> float:
    """
    Heavier parcels should go on lower shelves.
    """
    level = shelf.level
    num_shelves = shelf.rack.num_shelves
    # Heavy = bottom preference
    is_heavy = parcel_weight > 50  # kg threshold
    if is_heavy:
        # Strong preference for low shelves
        return max(0, 1.0 - ((level - 1) / max(num_shelves, 1)))
    else:
        # Light parcels: slight preference for upper shelves (free bottom for heavy)
        return 0.5 + 0.5 * ((level - 1) / max(num_shelves, 1))


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _get_gate_positions(warehouse) -> list[tuple]:
    """Get gate positions for a warehouse."""
    gates = DockBay.objects.filter(
        warehouse=warehouse,
        x_position__isnull=False,
        z_position__isnull=False,
    )
    positions = [(float(g.x_position), float(g.z_position)) for g in gates]
    if not positions:
        w = float(warehouse.width or 40)
        d = float(warehouse.depth or 30)
        positions = [(0, d / 2)]
    return positions


def _min_gate_distance(rack, gate_positions: list[tuple]) -> float:
    """Minimum distance from rack to any gate."""
    rack_pos = (float(rack.x_position), float(rack.z_position))
    if not gate_positions:
        return 10.0
    return min(
        math.sqrt((rack_pos[0] - gx) ** 2 + (rack_pos[1] - gz) ** 2)
        for gx, gz in gate_positions
    )
