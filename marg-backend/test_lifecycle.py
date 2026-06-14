import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marg_backend.settings')
django.setup()

from shipments.models import Shipment
from common.enums import ShipmentStatus
from operations.services.state_machine import get_valid_transitions

def test_workflow():
    current_state = ShipmentStatus.DRAFT
    print(f"Starting at: {current_state}")
    
    workflow_path = [
        ShipmentStatus.WAREHOUSE_APPROVED,
        ShipmentStatus.LOGISTICS_SELECTED,
        ShipmentStatus.DRIVER_ASSIGNED,
        ShipmentStatus.READY_FOR_PICKUP,
        ShipmentStatus.LOADING_IN_PROGRESS,
        ShipmentStatus.READY_FOR_TRANSIT,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.APPROACHING_DESTINATION,
        ShipmentStatus.ARRIVED_AT_GATE,
        ShipmentStatus.RECEIVING_IN_PROGRESS,
        ShipmentStatus.SLOTTING_IN_PROGRESS,
        ShipmentStatus.COMPLETED,
    ]
    
    for next_state in workflow_path:
        valid_targets = get_valid_transitions(current_state)
        if next_state in valid_targets:
            print(f"✓ Valid transition: {current_state} -> {next_state}")
            current_state = next_state
        else:
            print(f"✗ INVALID transition: {current_state} -> {next_state} (Valid options: {valid_targets})")
            return False
            
    print("Workflow validation complete.")
    return True

if __name__ == '__main__':
    test_workflow()
