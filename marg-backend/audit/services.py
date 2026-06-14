"""
Audit service — creates immutable audit trail records.
"""
from .models import AuditLog


def log_action(actor, action, resource_type, resource_id,
               organization=None, previous_state=None, new_state=None,
               ip_address=None, metadata=None):
    """
    Create an immutable audit log entry.

    Args:
        actor: The User performing the action.
        action: AuditAction enum value.
        resource_type: String name of the model (e.g. 'Shipment').
        resource_id: Primary key of the affected resource.
        organization: Organization FK (optional, derived from actor if not given).
        previous_state: Dict snapshot of the resource before the action.
        new_state: Dict snapshot of the resource after the action.
        ip_address: Client IP address (optional).
        metadata: Additional context dict (optional).
    """
    if organization is None and actor and hasattr(actor, 'organization'):
        organization = actor.organization

    return AuditLog.objects.create(
        organization=organization,
        actor=actor,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        previous_state=previous_state or {},
        new_state=new_state or {},
        ip_address=ip_address,
        metadata=metadata or {},
    )


def get_client_ip(request):
    """Extract client IP from request headers."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
