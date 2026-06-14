from django.db import models


class UserRole(models.TextChoices):
    """Roles available across the Marg platform."""
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    FACTORY_MANAGER = 'FACTORY_MANAGER', 'Factory Manager'
    WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER', 'Warehouse Manager'
    DRIVER = 'DRIVER', 'Driver'
    # New roles — Enterprise Platform
    ADMIN = 'ADMIN', 'Admin'          # Logistics Company Owner
    EMPLOYEE = 'EMPLOYEE', 'Employee'  # Field Operations
    # New roles - Factory
    DISPATCH_MANAGER = 'DISPATCH_MANAGER', 'Dispatch Manager'
    OPERATIONS_MANAGER = 'OPERATIONS_MANAGER', 'Operations Manager'
    INVENTORY_MANAGER = 'INVENTORY_MANAGER', 'Inventory Manager'
    FINANCE_MANAGER = 'FINANCE_MANAGER', 'Finance Manager'
    READ_ONLY = 'READ_ONLY', 'Read Only User'


class KycStatus(models.TextChoices):
    """KYC verification status for users."""
    PENDING = 'PENDING', 'Pending'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    VERIFIED = 'VERIFIED', 'Verified'
    REJECTED = 'REJECTED', 'Rejected'


class OrganizationType(models.TextChoices):
    """Types of organizations operating on the Marg platform."""
    FACTORY = 'FACTORY', 'Factory'
    WAREHOUSE = 'WAREHOUSE', 'Warehouse'
    LOGISTICS_PROVIDER = 'LOGISTICS_PROVIDER', 'Logistics Provider'



class WarehouseType(models.TextChoices):
    """Categorization of warehouses."""
    DESTINATION_WAREHOUSE = 'DESTINATION_WAREHOUSE', 'Destination Warehouse'
    TRANSIT_WAREHOUSE = 'TRANSIT_WAREHOUSE', 'Transit Warehouse'
    DISTRIBUTION_CENTER = 'DISTRIBUTION_CENTER', 'Distribution Center'



class DockStatus(models.TextChoices):
    """Operational status of a warehouse dock bay."""
    AVAILABLE = 'AVAILABLE', 'Available'
    OCCUPIED = 'OCCUPIED', 'Occupied'
    MAINTENANCE = 'MAINTENANCE', 'Maintenance'
    RESERVED = 'RESERVED', 'Reserved'


class DockType(models.TextChoices):
    """Type of operations a dock bay supports."""
    LOADING = 'LOADING', 'Loading'
    UNLOADING = 'UNLOADING', 'Unloading'
    BOTH = 'BOTH', 'Both'


class TruckStatus(models.TextChoices):
    """Current operational status of a truck."""
    AVAILABLE = 'AVAILABLE', 'Available'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE', 'Under Maintenance'
    OFFLINE = 'OFFLINE', 'Offline'


class ShipmentType(models.TextChoices):
    """Category of goods being shipped."""
    RAW_MATERIAL = 'RAW_MATERIAL', 'Raw Material'
    FINISHED_GOODS = 'FINISHED_GOODS', 'Finished Goods'
    RETURN_LOAD = 'RETURN_LOAD', 'Return Load'


class ShipmentPriority(models.TextChoices):
    """Urgency level of a shipment."""
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'


class ShipmentStatus(models.TextChoices):
    """Full lifecycle status of a shipment (Updated for Enterprise Handoffs)."""
    DRAFT = 'DRAFT', 'Draft'
    WAREHOUSE_APPROVED = 'WAREHOUSE_APPROVED', 'Warehouse Approved'
    LOGISTICS_SELECTED = 'LOGISTICS_SELECTED', 'Logistics Selected'
    DRIVER_ASSIGNED = 'DRIVER_ASSIGNED', 'Driver Assigned'
    READY_FOR_PICKUP = 'READY_FOR_PICKUP', 'Ready for Pickup'
    LOADING_IN_PROGRESS = 'LOADING_IN_PROGRESS', 'Loading In Progress'
    READY_FOR_TRANSIT = 'READY_FOR_TRANSIT', 'Ready for Transit'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
    APPROACHING_DESTINATION = 'APPROACHING_DESTINATION', 'Approaching Destination'
    ARRIVED_AT_GATE = 'ARRIVED_AT_GATE', 'Arrived at Gate'
    RECEIVING_IN_PROGRESS = 'RECEIVING_IN_PROGRESS', 'Receiving In Progress'
    SLOTTING_IN_PROGRESS = 'SLOTTING_IN_PROGRESS', 'Slotting In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    FAILED = 'FAILED', 'Failed'


# ─── Phase 2 Enums ──────────────────────────────────────────────────────────


class ShipmentEventType(models.TextChoices):
    """Types of events recorded in the shipment timeline."""
    SHIPMENT_CREATED = 'SHIPMENT_CREATED', 'Shipment Created'
    TRUCK_ASSIGNED = 'TRUCK_ASSIGNED', 'Truck Assigned'
    TRUCK_UNASSIGNED = 'TRUCK_UNASSIGNED', 'Truck Unassigned'
    DRIVER_ASSIGNED = 'DRIVER_ASSIGNED', 'Driver Assigned'
    DRIVER_UNASSIGNED = 'DRIVER_UNASSIGNED', 'Driver Unassigned'
    DOCK_RESERVED = 'DOCK_RESERVED', 'Dock Reserved'
    DISPATCHED = 'DISPATCHED', 'Dispatched'
    ARRIVED = 'ARRIVED', 'Arrived'
    DOCK_ENTERED = 'DOCK_ENTERED', 'Dock Entered'
    UNLOADING_STARTED = 'UNLOADING_STARTED', 'Unloading Started'
    UNLOADING_COMPLETED = 'UNLOADING_COMPLETED', 'Unloading Completed'
    SHIPMENT_COMPLETED = 'SHIPMENT_COMPLETED', 'Shipment Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    STATUS_CHANGED = 'STATUS_CHANGED', 'Status Changed'
    # Phase 3 additions
    GEOFENCE_ENTERED = 'GEOFENCE_ENTERED', 'Geofence Entered'
    GEOFENCE_EXITED = 'GEOFENCE_EXITED', 'Geofence Exited'
    ETA_UPDATED = 'ETA_UPDATED', 'ETA Updated'
    RETURN_LOAD_MATCHED = 'RETURN_LOAD_MATCHED', 'Return Load Matched'
    RETURN_LOAD_ACCEPTED = 'RETURN_LOAD_ACCEPTED', 'Return Load Accepted'
    DELAY_DETECTED = 'DELAY_DETECTED', 'Delay Detected'
    # Enterprise Platform additions
    LOADING_VERIFIED = 'LOADING_VERIFIED', 'Loading Verified'
    MILESTONE_CONFIRMED = 'MILESTONE_CONFIRMED', 'Milestone Confirmed'
    POD_SUBMITTED = 'POD_SUBMITTED', 'PoD Submitted'
    DELAY_REPORTED = 'DELAY_REPORTED', 'Delay Reported'
    ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED', 'Assignment Created'
    ASSIGNMENT_ACCEPTED = 'ASSIGNMENT_ACCEPTED', 'Assignment Accepted'
    CHAT_ESCALATION = 'CHAT_ESCALATION', 'Chat Escalation'
    GATE_CHECK_IN = 'GATE_CHECK_IN', 'Gate Check-In'
    RECEIVING_STARTED = 'RECEIVING_STARTED', 'Receiving Started'
    RECEIVING_COMPLETED = 'RECEIVING_COMPLETED', 'Receiving Completed'
    EXCEPTION_RAISED = 'EXCEPTION_RAISED', 'Exception Raised'


class ReservationStatus(models.TextChoices):
    """Status of a dock reservation."""
    ACTIVE = 'ACTIVE', 'Active'
    EXPIRED = 'EXPIRED', 'Expired'
    CANCELLED = 'CANCELLED', 'Cancelled'
    COMPLETED = 'COMPLETED', 'Completed'


class NotificationType(models.TextChoices):
    """Categories of notifications."""
    SHIPMENT = 'SHIPMENT', 'Shipment'
    ASSIGNMENT = 'ASSIGNMENT', 'Assignment'
    DOCK = 'DOCK', 'Dock'
    SYSTEM = 'SYSTEM', 'System'
    ALERT = 'ALERT', 'Alert'
    # Phase 3 additions
    TELEMETRY = 'TELEMETRY', 'Telemetry'
    GEOFENCE = 'GEOFENCE', 'Geofence'
    RETURN_LOAD = 'RETURN_LOAD', 'Return Load'
    # Enterprise Platform additions
    CHAT = 'CHAT', 'Chat'
    MILESTONE = 'MILESTONE', 'Milestone'
    VERIFICATION = 'VERIFICATION', 'Verification'
    KYC = 'KYC', 'KYC'
    POD = 'POD', 'Proof of Delivery'


class AuditAction(models.TextChoices):
    """Actions that are recorded in the audit trail."""
    SHIPMENT_CREATED = 'SHIPMENT_CREATED', 'Shipment Created'
    SHIPMENT_UPDATED = 'SHIPMENT_UPDATED', 'Shipment Updated'
    TRUCK_ASSIGNED = 'TRUCK_ASSIGNED', 'Truck Assigned'
    TRUCK_UNASSIGNED = 'TRUCK_UNASSIGNED', 'Truck Unassigned'
    DRIVER_ASSIGNED = 'DRIVER_ASSIGNED', 'Driver Assigned'
    DRIVER_UNASSIGNED = 'DRIVER_UNASSIGNED', 'Driver Unassigned'
    DOCK_RESERVED = 'DOCK_RESERVED', 'Dock Reserved'
    DOCK_RELEASED = 'DOCK_RELEASED', 'Dock Released'
    DISPATCH_APPROVED = 'DISPATCH_APPROVED', 'Dispatch Approved'
    SHIPMENT_ARRIVED = 'SHIPMENT_ARRIVED', 'Shipment Arrived'
    UNLOADING_STARTED = 'UNLOADING_STARTED', 'Unloading Started'
    SHIPMENT_COMPLETED = 'SHIPMENT_COMPLETED', 'Shipment Completed'
    SHIPMENT_CANCELLED = 'SHIPMENT_CANCELLED', 'Shipment Cancelled'
    # Phase 3 additions
    TELEMETRY_RECEIVED = 'TELEMETRY_RECEIVED', 'Telemetry Received'
    GEOFENCE_TRIGGERED = 'GEOFENCE_TRIGGERED', 'Geofence Triggered'
    RETURN_LOAD_ACCEPTED = 'RETURN_LOAD_ACCEPTED', 'Return Load Accepted'
    DOCK_SWAP_APPROVED = 'DOCK_SWAP_APPROVED', 'Dock Swap Approved'
    # Enterprise Platform additions
    LOADING_VERIFIED = 'LOADING_VERIFIED', 'Loading Verified'
    MILESTONE_CONFIRMED = 'MILESTONE_CONFIRMED', 'Milestone Confirmed'
    POD_SUBMITTED = 'POD_SUBMITTED', 'PoD Submitted'
    ASSIGNMENT_CREATED = 'ASSIGNMENT_CREATED', 'Assignment Created'
    KYC_SUBMITTED = 'KYC_SUBMITTED', 'KYC Submitted'
    KYC_VERIFIED = 'KYC_VERIFIED', 'KYC Verified'


# ─── Phase 3 Enums ──────────────────────────────────────────────────────────


class ReturnLoadStatus(models.TextChoices):
    """Status of a return-load match."""
    SUGGESTED = 'SUGGESTED', 'Suggested'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    DECLINED = 'DECLINED', 'Declined'
    COMPLETED = 'COMPLETED', 'Completed'


class RecommendationType(models.TextChoices):
    """Types of dock optimization recommendations."""
    DOCK_SWAP = 'DOCK_SWAP', 'Dock Swap'
    DOCK_ASSIGNMENT = 'DOCK_ASSIGNMENT', 'Dock Assignment'
    DELAY_ALERT = 'DELAY_ALERT', 'Delay Alert'


class RecommendationStatus(models.TextChoices):
    """Status of a dock recommendation."""
    PENDING = 'PENDING', 'Pending'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'


# ─── Phase 7 Enums ──────────────────────────────────────────────────────────


class ParcelStatus(models.TextChoices):
    """Lifecycle status of a parcel in warehouse storage."""
    PENDING = 'PENDING', 'Pending'
    STORED = 'STORED', 'Stored'
    DISPATCHED = 'DISPATCHED', 'Dispatched'


class ParcelPriority(models.TextChoices):
    """Priority level for parcel dispatch."""
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'


# ─── Phase 8: Lot & Logistics Enums ─────────────────────────────────────────


class LotStatus(models.TextChoices):
    """Lifecycle status of a Lot."""
    DRAFT = 'DRAFT', 'Draft'
    UNDER_REVIEW = 'UNDER_REVIEW', 'Under Review'
    SHARED = 'SHARED', 'Shared with Logistics'
    ACCEPTED = 'ACCEPTED', 'Accepted Quote'
    SHIPMENT_GENERATED = 'SHIPMENT_GENERATED', 'Shipment Generated'
    COMPLETED = 'COMPLETED', 'Completed'


class QuoteStatus(models.TextChoices):
    """Lifecycle status of a logistics quote."""
    PENDING = 'PENDING', 'Pending'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    REJECTED = 'REJECTED', 'Rejected'
    REVISION_REQUESTED = 'REVISION_REQUESTED', 'Revision Requested'


# ─── Enterprise Platform Enums ──────────────────────────────────────────────


class MilestoneType(models.TextChoices):
    """Trip milestone checkpoints."""
    ARRIVED_FACTORY = 'ARRIVED_FACTORY', 'Arrived at Factory'
    LOADING_COMPLETE = 'LOADING_COMPLETE', 'Loading Completed'
    LOADING_VERIFIED = 'LOADING_VERIFIED', 'Loading Verified'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
    ARRIVED_DESTINATION = 'ARRIVED_DESTINATION', 'Arrived at Destination'
    POD_SUBMITTED = 'POD_SUBMITTED', 'PoD Submitted'


class DelayType(models.TextChoices):
    """Types of delays drivers can report."""
    TRAFFIC = 'TRAFFIC', 'Traffic'
    FLAT_TIRE = 'FLAT_TIRE', 'Flat Tire'
    POLICE_CHECKPOINT = 'POLICE_CHECKPOINT', 'Police Checkpoint'
    WEATHER = 'WEATHER', 'Weather'
    MECHANICAL = 'MECHANICAL', 'Mechanical Issue'
    OTHER = 'OTHER', 'Other'


class AssignmentStatus(models.TextChoices):
    """Status of a driver+truck assignment."""
    PROPOSED = 'PROPOSED', 'Proposed'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    DISPATCHED = 'DISPATCHED', 'Dispatched'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class MarketplaceLoadStatus(models.TextChoices):
    """Status of a marketplace load listing."""
    AVAILABLE = 'AVAILABLE', 'Available'
    LOCKED = 'LOCKED', 'Locked'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    EXPIRED = 'EXPIRED', 'Expired'


class MarketplaceLoadType(models.TextChoices):
    """Type of marketplace load."""
    TIE_UP = 'TIE_UP', 'Tie-Up Factory'
    OPEN_MARKET = 'OPEN_MARKET', 'Open Market'


class ChatMessageType(models.TextChoices):
    """Type of chat message."""
    TEXT = 'TEXT', 'Text'
    IMAGE = 'IMAGE', 'Image'
    DOCUMENT = 'DOCUMENT', 'Document'
    SYSTEM = 'SYSTEM', 'System Message'


class KycDocumentType(models.TextChoices):
    """Types of KYC documents."""
    GSTIN = 'GSTIN', 'GSTIN'
    PAN = 'PAN', 'PAN Card'
    DRIVING_LICENSE = 'DRIVING_LICENSE', 'Driving License'
    PROFILE_PHOTO = 'PROFILE_PHOTO', 'Profile Photo'
    VAHAN = 'VAHAN', 'Vahan Verification'
    COMPANY_REGISTRATION = 'COMPANY_REGISTRATION', 'Company Registration'
