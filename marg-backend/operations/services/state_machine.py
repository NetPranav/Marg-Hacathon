"""
Shipment State Machine — validates and enforces status transitions.

This is the single source of truth for what transitions are allowed.
All operations MUST go through this module to change shipment status.
"""
from common.enums import ShipmentStatus


# Map of current_status → set of valid next statuses
TRANSITION_MAP = {
    ShipmentStatus.DRAFT: {
        ShipmentStatus.WAREHOUSE_APPROVED,
        ShipmentStatus.CANCELLED,
    },
    ShipmentStatus.WAREHOUSE_APPROVED: {
        ShipmentStatus.LOGISTICS_SELECTED,
        ShipmentStatus.CANCELLED,
    },
    ShipmentStatus.LOGISTICS_SELECTED: {
        ShipmentStatus.DRIVER_ASSIGNED,
        ShipmentStatus.CANCELLED,
    },
    ShipmentStatus.DRIVER_ASSIGNED: {
        ShipmentStatus.READY_FOR_PICKUP,
        ShipmentStatus.CANCELLED,
        ShipmentStatus.LOGISTICS_SELECTED, # Unassign driver
    },
    ShipmentStatus.READY_FOR_PICKUP: {
        ShipmentStatus.LOADING_IN_PROGRESS,
        ShipmentStatus.CANCELLED,
    },
    ShipmentStatus.LOADING_IN_PROGRESS: {
        ShipmentStatus.READY_FOR_TRANSIT,
        ShipmentStatus.CANCELLED,
    },
    ShipmentStatus.READY_FOR_TRANSIT: {
        ShipmentStatus.DOCK_REQUESTED,
        ShipmentStatus.CANCELLED,
    },
    ShipmentStatus.DOCK_REQUESTED: {
        ShipmentStatus.DOCK_APPROVED,
        ShipmentStatus.READY_FOR_TRANSIT,
        ShipmentStatus.CANCELLED,
    },
    ShipmentStatus.DOCK_APPROVED: {
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.CANCELLED,
    },
    ShipmentStatus.IN_TRANSIT: {
        ShipmentStatus.APPROACHING_DESTINATION,
        ShipmentStatus.FAILED,
    },
    ShipmentStatus.APPROACHING_DESTINATION: {
        ShipmentStatus.ARRIVED_AT_GATE,
        ShipmentStatus.FAILED,
    },
    ShipmentStatus.ARRIVED_AT_GATE: {
        ShipmentStatus.RECEIVING_IN_PROGRESS,
        ShipmentStatus.FAILED,
    },
    ShipmentStatus.RECEIVING_IN_PROGRESS: {
        ShipmentStatus.SLOTTING_IN_PROGRESS,
        ShipmentStatus.FAILED,
    },
    ShipmentStatus.SLOTTING_IN_PROGRESS: {
        ShipmentStatus.COMPLETED,
        ShipmentStatus.FAILED,
    },
    ShipmentStatus.COMPLETED: set(),
    ShipmentStatus.CANCELLED: set(),
    ShipmentStatus.FAILED: set(),
}


class InvalidTransitionError(Exception):
    """Raised when an invalid state transition is attempted."""
    def __init__(self, current_status, target_status):
        self.current_status = current_status
        self.target_status = target_status
        super().__init__(
            f"Invalid transition: {current_status} → {target_status}"
        )


def validate_transition(current_status: str, target_status: str) -> bool:
    """
    Check if transitioning from current_status to target_status is allowed.
    Returns True if valid, raises InvalidTransitionError otherwise.
    """
    valid_targets = TRANSITION_MAP.get(current_status, set())
    if target_status not in valid_targets:
        raise InvalidTransitionError(current_status, target_status)
    return True


def transition_shipment(shipment, target_status: str) -> str:
    """
    Validate and apply a status transition to a shipment.
    Returns the previous status for audit logging.
    """
    previous_status = shipment.status
    validate_transition(previous_status, target_status)
    shipment.status = target_status
    shipment.save(update_fields=['status', 'updated_at'])
    
    # Broadcast to realtime channels
    try:
        from realtime.broadcast import broadcast_shipment_update
        from shipments.serializers import ShipmentSerializer
        broadcast_shipment_update(shipment.factory.organization_id, ShipmentSerializer(shipment).data)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to broadcast shipment update: {e}")
        
    return previous_status


def get_valid_transitions(current_status: str) -> list:
    """Return a list of valid target statuses for the given current status."""
    return list(TRANSITION_MAP.get(current_status, set()))
