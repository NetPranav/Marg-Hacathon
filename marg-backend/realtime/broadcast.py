"""
Broadcasting utility for pushing real-time updates to WebSocket channels.
Gracefully degrades if no channel layer (Redis) is available.
"""
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)


def _send_to_group(group_name, message):
    """Send a message to a channel group. Silently fails if no channel layer."""
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        async_to_sync(channel_layer.group_send)(group_name, message)
    except Exception as e:
        logger.warning(f'Failed to broadcast to {group_name}: {e}')


def broadcast_shipment_update(organization_id, shipment_data):
    """Broadcast a shipment status update to factory dashboard."""
    _send_to_group(f'factory_{organization_id}', {
        'type': 'shipment_update',
        'data': shipment_data,
    })
    # Also notify the driver if assigned
    if shipment_data.get('assigned_driver'):
        driver_id = shipment_data['assigned_driver']
        # If it's a dict, get the id
        if isinstance(driver_id, dict):
            driver_id = driver_id.get('id')
        _send_to_group(f"driver_{driver_id}", {
            'type': 'shipment_update',
            'data': shipment_data
        })
    _send_to_group('admin_global', {
        'type': 'shipment_update',
        'data': shipment_data,
    })


def broadcast_telemetry(organization_id, telemetry_data):
    """Broadcast a truck location update."""
    _send_to_group(f'factory_{organization_id}', {
        'type': 'telemetry_update',
        'data': telemetry_data,
    })
    _send_to_group(f'warehouse_org_{organization_id}', {
        'type': 'telemetry_update',
        'data': telemetry_data,
    })


def broadcast_dock_recommendation(organization_id, recommendation_data):
    """Broadcast a dock recommendation to warehouse dashboard."""
    _send_to_group(f'warehouse_org_{organization_id}', {
        'type': 'dock_recommendation',
        'data': recommendation_data,
    })


def broadcast_return_load(driver_id, return_load_data):
    """Broadcast a return-load opportunity to a driver."""
    _send_to_group(f'driver_{driver_id}', {
        'type': 'return_load_update',
        'data': return_load_data,
    })


def broadcast_eta_update(organization_id, eta_data):
    """Broadcast ETA update to factory and warehouse dashboards."""
    _send_to_group(f'factory_{organization_id}', {
        'type': 'eta_update',
        'data': eta_data,
    })
    _send_to_group(f'warehouse_org_{organization_id}', {
        'type': 'eta_update',
        'data': eta_data,
    })


def push_notification(user_id, notification_data):
    """Push a real-time notification to a specific user's channel."""
    # Note: requires user-specific channel group which isn't set up by default.
    # This is a placeholder for future user-channel implementation.
    pass
