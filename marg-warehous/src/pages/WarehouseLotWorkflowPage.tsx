import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Chip, Stepper, Step, StepLabel,
  StepContent, CircularProgress, Alert, LinearProgress, IconButton, Tooltip,
} from '@mui/material';
import {
  Assignment, CheckCircle, HourglassTop, Storefront, LocalShipping,
  PlaylistAddCheck, RocketLaunch, Map, ArrowBack, Lock,
  Refresh, Verified, Warning, Send, Search as SearchIcon, RequestQuote,
  Warehouse, Inventory2, AccessTime, DomainVerification,
} from '@mui/icons-material';
import SimpleMap from '@/components/SimpleMap';
import { lotsApi, shipmentsApi, docksApi } from '@/api/endpoints';

/* ── Status → Step mapping ─────────────────────────────────────── */
const STATUS_STEP_MAP: Record<string, number> = {
  DRAFT: 0,
  UNDER_REVIEW: 1,
  PENDING_WAREHOUSE_APPROVAL: 2,
  WAREHOUSE_REJECTED: 2,
  EXPIRED_WAREHOUSE_APPROVAL: 2,
  WAREHOUSE_APPROVED: 3,
  SHARED: 4,
  ACCEPTED: 5,
  SHIPMENT_GENERATED: 6,
  COMPLETED: 8,
};

/* ── Step definitions ──────────────────────────────────────────── */
const WORKFLOW_STEPS = [
  { label: 'Lot Created by Factory',     icon: <Assignment />,       key: 'draft' },
  { label: 'Factory Verification',       icon: <Verified />,         key: 'verify' },
  { label: 'Warehouse Approval',         icon: <Warehouse />,        key: 'warehouse',       role: 'WAREHOUSE' },
  { label: 'Logistics Partner Search',   icon: <SearchIcon />,       key: 'partner_search' },
  { label: 'Partner Selected',           icon: <Storefront />,       key: 'partner_select' },
  { label: 'Shipment Generated',         icon: <LocalShipping />,    key: 'shipment' },
  { label: 'Driver Loading Verification',icon: <PlaylistAddCheck />, key: 'checklist' },
  { label: 'Dock Reservation',           icon: <AccessTime />,       key: 'dock_request' },
  { label: 'Dock Approval',              icon: <DomainVerification />, key: 'dock_approve', role: 'WAREHOUSE' },
  { label: 'Dispatch',                   icon: <RocketLaunch />,     key: 'dispatch' },
  { label: 'Warehouse Receiving',        icon: <Map />,              key: 'track',           role: 'WAREHOUSE' },
];

const STATUS_COSMETICS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:                        { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  UNDER_REVIEW:                 { bg: '#FEF3C7', color: '#D97706', label: 'Under Review' },
  PENDING_WAREHOUSE_APPROVAL:   { bg: '#FFF7ED', color: '#EA580C', label: 'Awaiting Your Approval' },
  WAREHOUSE_APPROVED:           { bg: '#D1FAE5', color: '#059669', label: 'You Approved This' },
  WAREHOUSE_REJECTED:           { bg: '#FEE2E2', color: '#DC2626', label: 'You Rejected This' },
  EXPIRED_WAREHOUSE_APPROVAL:   { bg: '#FEE2E2', color: '#DC2626', label: 'Expired' },
  SHARED:                       { bg: '#DBEAFE', color: '#2563EB', label: 'Shared with Logistics' },
  ACCEPTED:                     { bg: '#D1FAE5', color: '#059669', label: 'Partner Accepted' },
  SHIPMENT_GENERATED:           { bg: '#EDE9FE', color: '#7C3AED', label: 'Shipment Generated' },
  COMPLETED:                    { bg: '#D1FAE5', color: '#059669', label: 'Completed' },
};

export default function WarehouseLotWorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [shipment, setShipment] = useState<any>(null);

  const loadLot = useCallback(async () => {
    try {
      const res = await lotsApi.get(Number(id));
      const lotData = res.data?.data ?? res.data;
      setLot(lotData);
      
      if (lotData.shipments && lotData.shipments.length > 0) {
        try {
          const shipRes = await shipmentsApi.get(lotData.shipments[0].id ?? lotData.shipments[0]);
          setShipment(shipRes.data?.data ?? shipRes.data);
        } catch { /* no shipment yet */ }
      }
    } catch {
      setError('Failed to load lot details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadLot(); }, [loadLot]);

  const currentStep = useMemo(() => {
    if (!lot) return 0;
    // Check shipment status for steps 6 to 10
    if (shipment) {
      if (shipment.status === 'COMPLETED') return 11;
      if (['SLOTTING_IN_PROGRESS', 'RECEIVING_IN_PROGRESS', 'ARRIVED_AT_GATE'].includes(shipment.status)) return 10; // Warehouse Receiving
      if (['IN_TRANSIT', 'APPROACHING_DESTINATION'].includes(shipment.status)) return 9; // Dispatch
      if (['DOCK_APPROVED'].includes(shipment.status)) return 9; // Dispatch
      if (['DOCK_REQUESTED'].includes(shipment.status)) return 8; // Dock Approval (Waiting for Warehouse)
      if (['READY_FOR_TRANSIT'].includes(shipment.status)) return 7; // Dock Reservation
      if (shipment.status === 'LOADING_IN_PROGRESS') return 6; // Driver verifying
      if (shipment.status === 'READY_FOR_PICKUP' || shipment.status === 'DRIVER_ASSIGNED' || shipment.status === 'DRAFT') return 6;
    }
    if (lot.status === 'SHIPMENT_GENERATED') return 6;
    return STATUS_STEP_MAP[lot.status] ?? 0;
  }, [lot, shipment]);

  const parcels = lot?.parcels ?? [];
  const totalWeight = parcels.reduce((s: number, p: any) => s + (parseFloat(p.weight) * (p.quantity || 1)), 0);
  const statusCosmetic = STATUS_COSMETICS[lot?.status] ?? STATUS_COSMETICS.DRAFT;

  /* ── Actions ─────────────────────────────────────────────────── */
  const doAction = async (fn: () => Promise<any>, msg: string) => {
    setActionLoading(true); setError(''); setSuccess('');
    try { await fn(); setSuccess(msg); await loadLot(); }
    catch (err: any) { setError(err.response?.data?.message || 'Action failed.'); }
    finally { setActionLoading(false); }
  };

  const handleApprove = () => doAction(() => lotsApi.approveWarehouse(Number(id)), 'Lot approved and parcels slotted!');
  const handleReject  = () => doAction(() => lotsApi.rejectWarehouse(Number(id)),  'Lot rejected.');

  /* ── Step icon ───────────────────────────────────────────────── */
  const renderStepIcon = (idx: number) => {
    const step = WORKFLOW_STEPS[idx];
    const isYours = (step as any).role === 'WAREHOUSE';
    if (idx < currentStep) {
      return (
        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle sx={{ color: '#059669', fontSize: 20 }} />
        </Box>
      );
    }
    if (idx === currentStep) {
      return (
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%',
          background: isYours ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' : 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isYours ? '0 4px 14px rgba(59, 130, 246, 0.4)' : '0 4px 14px rgba(249, 115, 22, 0.4)',
        }}>
          {React.cloneElement(step.icon, { sx: { color: '#fff', fontSize: 18 } })}
        </Box>
      );
    }
    return (
      <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Lock sx={{ color: '#D1D5DB', fontSize: 16 }} />
      </Box>
    );
  };

  /* ── Step content ────────────────────────────────────────────── */
  const renderStepContent = (idx: number) => {
    const isActive = idx === currentStep;
    const isComplete = idx < currentStep;
    const isLocked = idx > currentStep;
    const step = WORKFLOW_STEPS[idx];
    const isYours = (step as any).role === 'WAREHOUSE';

    if (isLocked) {
      return (
        <Box sx={{ py: 1.5, px: 2, bgcolor: '#FAFAFA', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
          <Typography variant="body2" sx={{ color: '#9CA3AF', fontStyle: 'italic' }}>
            Waiting for previous steps to complete
          </Typography>
        </Box>
      );
    }
    if (isComplete && !isYours) {
      return (
        <Box sx={{ py: 1, px: 2, bgcolor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
          <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ fontSize: 14 }} /> Completed
          </Typography>
        </Box>
      );
    }

    // Step 2 — Warehouse Approval (THIS IS THE WAREHOUSE'S STEP)
    if (idx === 2) {
      if (isComplete) {
        return (
          <Box sx={{ py: 1.5, px: 2, bgcolor: lot?.status === 'WAREHOUSE_REJECTED' ? '#FEF2F2' : '#F0FDF4', borderRadius: '12px', border: `1px solid ${lot?.status === 'WAREHOUSE_REJECTED' ? '#FECACA' : '#BBF7D0'}` }}>
            <Typography variant="body2" sx={{ color: lot?.status === 'WAREHOUSE_REJECTED' ? '#DC2626' : '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 14 }} /> {lot?.status === 'WAREHOUSE_REJECTED' ? 'You rejected this lot' : 'You approved this lot'}
            </Typography>
          </Box>
        );
      }
      if (isActive) {
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ borderRadius: '10px', mb: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <strong>Action required!</strong> This lot needs your approval before the factory can proceed.
            </Alert>
            <Card variant="outlined" sx={{ borderRadius: '12px', mb: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#332922' }}>Incoming Lot Details</Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A7F75' }}>Parcels</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{parcels.length}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A7F75' }}>Total Weight</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{totalWeight.toFixed(1)} kg</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A7F75' }}>From</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{lot?.factory_name || '—'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A7F75' }}>Dispatch Date</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{lot?.expected_dispatch_date || 'Not set'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                disabled={actionLoading}
                onClick={handleApprove}
                startIcon={actionLoading ? <CircularProgress size={16} /> : <CheckCircle />}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
              >
                Approve & Slot
              </Button>
              <Button
                variant="outlined"
                disabled={actionLoading}
                onClick={handleReject}
                startIcon={<Warning />}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, color: '#EF4444', borderColor: '#EF4444' }}
              >
                Reject
              </Button>
            </Box>
          </Box>
        );
      }
    }

    // Step 8 — Dock Approval (WAREHOUSE STEP)
    if (idx === 8) {
      if (isActive) {
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="warning" sx={{ borderRadius: '10px', mb: 2 }}>
              Logistics has requested a dock for ETA: <strong>{new Date(shipment?.expected_arrival_time).toLocaleString()}</strong>
            </Alert>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                disabled={actionLoading}
                onClick={() => doAction(async () => {
                  // Fetch docks using docksApi and post using client since approve-dock is not in shipmentsApi
                  const res = await docksApi.list();
                  const docks = res.data?.data || [];
                  const dockId = docks.length > 0 ? docks[0].id : 1;
                  const { default: client } = await import('@/api/client');
                  return client.post(`/shipments/${shipment.id}/approve-dock/`, { dock_id: dockId });
                }, 'Dock Approved')}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
              >
                Approve & Assign Dock
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={actionLoading}
                onClick={async () => {
                  const { default: client } = await import('@/api/client');
                  return doAction(() => client.post(`/shipments/${shipment.id}/reject-dock/`), 'Dock Rejected');
                }}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
              >
                Reject Request
              </Button>
            </Box>
          </Box>
        );
      }
    }

    // Step 9 — Dispatch
    if (idx === 9) {
      if (isActive) {
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ borderRadius: '10px', mb: 2 }}>
              Loading complete. Waiting for the driver to start the trip.
            </Alert>
            <Box sx={{ my: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Live Tracking Location</Typography>
              <SimpleMap />
            </Box>
          </Box>
        );
      }
    }

    // Step 10 — Warehouse Receiving Verification (THIS IS THE WAREHOUSE'S STEP)
    if (idx === 10) {
      if (shipment?.status === 'COMPLETED') {
        return (
          <Box sx={{ py: 1.5, px: 2, bgcolor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
            <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 14 }} /> Parcels received and verified!
            </Typography>
          </Box>
        );
      }
      if (isActive) {
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ borderRadius: '10px', mb: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <strong>Shipment {shipment?.shipment_number || 'is approaching'}!</strong> Once the truck arrives, verify the parcels and mark receiving complete.
            </Alert>
            <Box sx={{ my: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Live Tracking Location</Typography>
              <SimpleMap />
            </Box>
            <Button
              variant="contained"
              disabled={actionLoading}
              onClick={() => {
                if (shipment?.id) {
                  window.location.href = `/receiving-checklist/${shipment.id}`;
                }
              }}
              startIcon={<CheckCircle />}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
            >
              Verify Parcels & Complete Receiving
            </Button>
          </Box>
        );
      }
    }

    // Generic active step — read-only for warehouse (factory/logistics steps)
    if (isActive) {
      return (
        <Box sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <CircularProgress size={18} sx={{ color: '#F97316' }} />
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              Waiting for {idx <= 1 ? 'the factory' : idx >= 3 && idx <= 5 ? 'logistics coordination' : 'dispatch operations'} to complete this step…
            </Typography>
          </Box>
          <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={loadLot}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, mt: 1 }}>
            Refresh Status
          </Button>
        </Box>
      );
    }

    return null;
  };

  /* ── Loading / error ─────────────────────────────────────────── */
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#3B82F6' }} /></Box>;
  if (!lot) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Lot not found</Typography><Button onClick={() => navigate('/warehouse-approvals')} sx={{ mt: 2 }}>← Back</Button></Box>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/warehouse-approvals')} sx={{ bgcolor: '#FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>{lot.lot_number}</Typography>
            <Chip label={statusCosmetic.label} size="small" sx={{ bgcolor: statusCosmetic.bg, color: statusCosmetic.color, fontWeight: 700, borderRadius: '8px' }} />
          </Box>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.3 }}>
            {lot.factory_name} → {lot.destination_name}
          </Typography>
        </Box>
        <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={loadLot} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>Refresh</Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: '12px' }}>{success}</Alert>}

      {/* Progress */}
      <Card sx={{ mb: 3, borderRadius: '20px', overflow: 'hidden' }}>
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>Order Progress</Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Step {currentStep + 1} of {WORKFLOW_STEPS.length}</Typography>
          </Box>
          <LinearProgress variant="determinate" value={((currentStep + 1) / WORKFLOW_STEPS.length) * 100}
            sx={{ height: 8, borderRadius: 4, bgcolor: '#F3F4F6', '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%)' } }} />
        </Box>
        <Box sx={{ display: 'flex', px: 2, py: 1.5, gap: 0.5, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
          {WORKFLOW_STEPS.map((step, idx) => {
            const isYours = (step as any).role === 'WAREHOUSE';
            return (
              <Tooltip key={step.key} title={step.label}>
                <Box sx={{
                  flex: '0 0 auto', px: 1.5, py: 0.5, borderRadius: '8px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
                  bgcolor: idx < currentStep ? '#D1FAE5' : idx === currentStep ? (isYours ? '#DBEAFE' : '#FFF7ED') : '#F9FAFB',
                  color: idx < currentStep ? '#059669' : idx === currentStep ? (isYours ? '#1D4ED8' : '#EA580C') : '#D1D5DB',
                  border: idx === currentStep ? `1.5px solid ${isYours ? '#3B82F6' : '#F97316'}` : '1px solid transparent',
                }}>
                  {isYours && idx === currentStep ? '⬤ ' : ''}{step.label}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Card>

      {/* Stepper */}
      <Card sx={{ borderRadius: '20px', p: { xs: 2, md: 3 } }}>
        <Stepper activeStep={currentStep} orientation="vertical" sx={{ '& .MuiStepConnector-line': { borderColor: '#E5E7EB', borderLeftWidth: 2, minHeight: 20 } }}>
          {WORKFLOW_STEPS.map((step, idx) => (
            <Step key={step.key} expanded={idx === currentStep}>
              <StepLabel StepIconComponent={() => renderStepIcon(idx)} sx={{
                '& .MuiStepLabel-label': {
                  fontWeight: idx === currentStep ? 700 : idx < currentStep ? 600 : 400,
                  color: idx === currentStep ? '#0F172A' : idx < currentStep ? '#059669' : '#9CA3AF',
                  fontSize: '0.9rem',
                },
              }}>
                {step.label}
                {(step as any).role === 'WAREHOUSE' && <Chip label="Your Step" size="small" sx={{ ml: 1, bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />}
              </StepLabel>
              <StepContent TransitionProps={{ unmountOnExit: false }} sx={{ borderLeftWidth: 2, borderColor: '#E5E7EB', ml: '18px', pl: 3 }}>
                {renderStepContent(idx)}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Card>
    </Box>
  );
}
