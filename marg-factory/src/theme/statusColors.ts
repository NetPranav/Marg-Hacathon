export const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:                   { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  WAREHOUSE_APPROVED:      { bg: '#DBEAFE', color: '#2563EB', label: 'Warehouse Approved' },
  LOGISTICS_SELECTED:      { bg: '#E0E7FF', color: '#4F46E5', label: 'Logistics Selected' },
  DRIVER_ASSIGNED:         { bg: '#FEF3C7', color: '#D97706', label: 'Driver Assigned' },
  READY_FOR_PICKUP:        { bg: '#FFF7ED', color: '#EA580C', label: 'Ready for Pickup' },
  LOADING_IN_PROGRESS:     { bg: '#DBEAFE', color: '#2563EB', label: 'Loading In Progress' },
  READY_FOR_TRANSIT:       { bg: '#E0E7FF', color: '#4F46E5', label: 'Ready for Transit' },
  IN_TRANSIT:              { bg: '#FFF7ED', color: '#F97316', label: 'In Transit' },
  APPROACHING_DESTINATION: { bg: '#FEF3C7', color: '#D97706', label: 'Approaching Destination' },
  ARRIVED_AT_GATE:         { bg: '#D1FAE5', color: '#059669', label: 'Arrived at Gate' },
  RECEIVING_IN_PROGRESS:   { bg: '#DBEAFE', color: '#2563EB', label: 'Receiving In Progress' },
  SLOTTING_IN_PROGRESS:    { bg: '#E0E7FF', color: '#4F46E5', label: 'Slotting In Progress' },
  COMPLETED:               { bg: '#D1FAE5', color: '#059669', label: 'Completed' },
  CANCELLED:               { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
  FAILED:                  { bg: '#FEE2E2', color: '#DC2626', label: 'Failed' },
};

export const PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  LOW:      { bg: '#F3F4F6', color: '#6B7280' },
  MEDIUM:   { bg: '#DBEAFE', color: '#2563EB' },
  HIGH:     { bg: '#FFF7ED', color: '#F97316' },
  CRITICAL: { bg: '#FEE2E2', color: '#DC2626' },
};
