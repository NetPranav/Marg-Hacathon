import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, Chip, Stepper, Step, StepLabel,
  StepContent, CircularProgress, Alert, Divider, IconButton, Tooltip, Collapse,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  Assignment, CheckCircle, HourglassTop, Storefront, LocalShipping,
  PlaylistAddCheck, RocketLaunch, Map, ArrowBack, Lock, LockOpen,
  Refresh, ContentCopy, Delete, Edit, Verified, Warning, ExpandMore,
  ExpandLess, Send, Search as SearchIcon, RequestQuote, AccessTime, DomainVerification,
} from '@mui/icons-material';
import { lotsApi, shipmentsApi, logisticsApi } from '@/api/endpoints';
import SimpleMap from '@/components/SimpleMap';

/* ── Status → Step Index mapping ───────────────────────────────── */
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

const WORKFLOW_STEPS = [
  { label: 'Draft Lot',                icon: <Assignment />,        key: 'draft' },
  { label: 'Verify Lot',              icon: <Verified />,           key: 'verify' },
  { label: 'Warehouse Confirmation',   icon: <HourglassTop />,      key: 'warehouse' },
  { label: 'Find Logistics Partner',   icon: <SearchIcon />,        key: 'partner_search' },
  { label: 'Select Partner',          icon: <Storefront />,         key: 'partner_select' },
  { label: 'Generate Shipment',       icon: <LocalShipping />,      key: 'shipment' },
  { label: 'Driver Loading Verification', icon: <PlaylistAddCheck />,key: 'checklist' },
  { label: 'Dock Reservation',        icon: <AccessTime />,         key: 'dock_request' },
  { label: 'Dock Approval',           icon: <DomainVerification />, key: 'dock_approve' },
  { label: 'Dispatch Shipment',       icon: <RocketLaunch />,       key: 'dispatch' },
  { label: 'Warehouse Receiving',     icon: <Map />,                key: 'track' },
];

/* ── Status cosmetics ──────────────────────────────────────────── */
const STATUS_COSMETICS: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:                        { bg: '#F3F4F6', color: '#6B7280', label: 'Draft' },
  UNDER_REVIEW:                 { bg: '#FEF3C7', color: '#D97706', label: 'Under Review' },
  PENDING_WAREHOUSE_APPROVAL:   { bg: '#FFF7ED', color: '#EA580C', label: 'Awaiting Warehouse' },
  WAREHOUSE_APPROVED:           { bg: '#D1FAE5', color: '#059669', label: 'Warehouse Approved' },
  WAREHOUSE_REJECTED:           { bg: '#FEE2E2', color: '#DC2626', label: 'Warehouse Rejected' },
  EXPIRED_WAREHOUSE_APPROVAL:   { bg: '#FEE2E2', color: '#DC2626', label: 'Expired' },
  SHARED:                       { bg: '#DBEAFE', color: '#2563EB', label: 'Shared with Logistics' },
  ACCEPTED:                     { bg: '#D1FAE5', color: '#059669', label: 'Partner Accepted' },
  SHIPMENT_GENERATED:           { bg: '#EDE9FE', color: '#7C3AED', label: 'Shipment Generated' },
  COMPLETED:                    { bg: '#D1FAE5', color: '#059669', label: 'Completed' },
};

export default function LotWorkflowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [lot, setLot] = useState<any>(null);
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /* ── Data loading ────────────────────────────────────────────── */
  const loadLot = useCallback(async () => {
    try {
      const res = await lotsApi.get(Number(id));
      const lotData = res.data?.data ?? res.data;
      setLot(lotData);

      // If the lot has a generated shipment, load it
      if (lotData.shipments && lotData.shipments.length > 0) {
        try {
          const shipRes = await shipmentsApi.get(lotData.shipments[0].id ?? lotData.shipments[0]);
          setShipment(shipRes.data?.data ?? shipRes.data);
        } catch { /* no shipment yet */ }
      }
    } catch (err: any) {
      setError('Failed to load lot details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadLot(); }, [loadLot]);

  /* ── Computed values ─────────────────────────────────────────── */
  const currentStep = useMemo(() => {
    if (!lot) return 0;
    
    // Check shipment status for steps 6 to 10
    if (shipment) {
      if (['COMPLETED', 'SLOTTING_IN_PROGRESS', 'RECEIVING_IN_PROGRESS', 'ARRIVED_AT_GATE'].includes(shipment.status)) return 10; // Warehouse Receiving
      if (['IN_TRANSIT', 'APPROACHING_DESTINATION'].includes(shipment.status)) return 10; // Waiting for warehouse receiving
      if (shipment.status === 'DOCK_APPROVED') return 9; // Dispatch Shipment
      if (shipment.status === 'DOCK_REQUESTED') return 8; // Dock Approval
      if (shipment.status === 'READY_FOR_TRANSIT') return 7; // Dock Reservation
      if (shipment.status === 'LOADING_IN_PROGRESS') return 6; // Driver verifying
      if (shipment.status === 'READY_FOR_PICKUP' || shipment.status === 'DRIVER_ASSIGNED' || shipment.status === 'DRAFT') return 6;
      if (lot.status === 'SHIPMENT_GENERATED') return 6;
    }
    return STATUS_STEP_MAP[lot.status] ?? 0;
  }, [lot, shipment]);

  const parcels = lot?.parcels ?? [];
  const totalWeight = parcels.reduce((s: number, p: any) => s + (parseFloat(p.weight) * (p.quantity || 1)), 0);
  const totalVolume = parcels.reduce((s: number, p: any) => {
    return s + ((parseFloat(p.length || 0) * parseFloat(p.width || 0) * parseFloat(p.height || 0)) / 1_000_000) * (p.quantity || 1);
  }, 0);
  const statusCosmetic = STATUS_COSMETICS[lot?.status] ?? STATUS_COSMETICS.DRAFT;

  /* ── Verification checks ─────────────────────────────────────── */
  const verificationChecks = useMemo(() => {
    if (!lot) return [];
    const checks = [
      { label: 'Has destination warehouse', pass: !!lot.destination_warehouse },
      { label: 'Has at least 1 parcel', pass: parcels.length > 0 },
      { label: 'All parcels have dimensions', pass: parcels.every((p: any) => p.length > 0 && p.width > 0 && p.height > 0) },
      { label: 'All parcels have weight', pass: parcels.every((p: any) => p.weight > 0) },
      { label: 'Expected dispatch date set', pass: !!lot.expected_dispatch_date },
    ];
    return checks;
  }, [lot, parcels]);

  const allVerified = verificationChecks.every(c => c.pass);

  /* ── Action handlers ─────────────────────────────────────────── */
  const doAction = async (fn: () => Promise<any>, successMsg: string) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await fn();
      setSuccess(successMsg);
      await loadLot();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendToWarehouse = () =>
    doAction(
      () => lotsApi.update(Number(id), { status: 'PENDING_WAREHOUSE_APPROVAL' }),
      'Lot sent to warehouse for approval!'
    );

  const handleShareWithLogistics = () =>
    doAction(
      () => lotsApi.update(Number(id), { status: 'SHARED' }),
      'Lot shared with logistics partners!'
    );

  const handleGenerateShipment = () =>
    doAction(
      () => shipmentsApi.create({
        factory: lot.factory,
        destination_warehouse: lot.destination_warehouse,
        lot: lot.id,
        expected_dispatch_time: lot.expected_dispatch_date,
      }),
      'Shipment generated successfully!'
    );

  const handleDispatch = () => {
    if (!shipment) return;
    doAction(
      () => shipmentsApi.dispatch(shipment.id),
      'Shipment dispatched!'
    );
  };

  /* ── Render helpers ──────────────────────────────────────────── */
  const renderStepIcon = (stepIdx: number) => {
    const step = WORKFLOW_STEPS[stepIdx];
    if (stepIdx < currentStep) {
      return (
        <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle sx={{ color: '#059669', fontSize: 20 }} />
        </Box>
      );
    }
    if (stepIdx === currentStep) {
      return (
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
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
  const renderStepContent = (stepIdx: number) => {
    const isActive = stepIdx === currentStep;
    const isComplete = stepIdx < currentStep;
    const isLocked = stepIdx > currentStep;

    if (isLocked) {
      return (
        <Box sx={{ py: 1.5, px: 2, bgcolor: '#FAFAFA', borderRadius: '12px', border: '1px dashed #E5E7EB' }}>
          <Typography variant="body2" sx={{ color: '#9CA3AF', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock sx={{ fontSize: 14 }} /> Complete the previous step to unlock
          </Typography>
        </Box>
      );
    }

    if (isComplete) {
      return (
        <Box sx={{ py: 1, px: 2, bgcolor: '#F0FDF4', borderRadius: '12px', border: '1px solid #BBF7D0' }}>
          <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ fontSize: 14 }} /> Completed
          </Typography>
        </Box>
      );
    }

    // ─── Active step content ───
    switch (stepIdx) {
      case 0: // Draft
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              Review and edit the lot details. Add or remove parcels as needed.
            </Typography>
            {/* Parcel summary */}
            <Card variant="outlined" sx={{ mb: 2, borderRadius: '12px' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#332922' }}>
                  Parcel Summary — {parcels.length} item{parcels.length !== 1 ? 's' : ''}
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A7F75' }}>Total Weight</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{totalWeight.toFixed(1)} kg</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A7F75' }}>Total Volume</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{totalVolume.toFixed(3)} m³</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8A7F75' }}>Destination</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{lot?.destination_name || 'Not set'}</Typography>
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
                size="small"
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
                onClick={() => navigate(`/lots/new?edit=${id}`)}
                startIcon={<Edit />}
              >
                Edit Lot
              </Button>
            </Box>
          </Box>
        );

      case 1: // Verify
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              All checks must pass before the lot can be sent to the warehouse.
            </Typography>
            <Card variant="outlined" sx={{ borderRadius: '12px', mb: 2 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {verificationChecks.map((check, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.8 }}>
                    {check.pass ? (
                      <CheckCircle sx={{ color: '#22C55E', fontSize: 18 }} />
                    ) : (
                      <Warning sx={{ color: '#EF4444', fontSize: 18 }} />
                    )}
                    <Typography variant="body2" sx={{ color: check.pass ? '#374151' : '#EF4444', fontWeight: check.pass ? 400 : 600 }}>
                      {check.label}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
            {allVerified ? (
              <Button
                variant="contained"
                size="small"
                disabled={actionLoading}
                onClick={handleSendToWarehouse}
                startIcon={actionLoading ? <CircularProgress size={16} /> : <Send />}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
              >
                Verify & Send to Warehouse
              </Button>
            ) : (
              <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                Fix the failing checks above before sending to the warehouse.
              </Alert>
            )}
          </Box>
        );

      case 2: // Warehouse Confirmation
        return (
          <Box sx={{ py: 2 }}>
            {lot?.status === 'WAREHOUSE_REJECTED' ? (
              <Alert severity="error" sx={{ borderRadius: '10px', mb: 2 }}>
                Warehouse has <strong>rejected</strong> this lot. Please revise the lot and resubmit.
              </Alert>
            ) : (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CircularProgress size={20} sx={{ color: '#F97316' }} />
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>
                    Waiting for the destination warehouse to confirm this incoming lot…
                  </Typography>
                </Box>
                <LinearProgress
                  variant="indeterminate"
                  sx={{
                    height: 4, borderRadius: 2, mb: 2,
                    bgcolor: '#FFF7ED',
                    '& .MuiLinearProgress-bar': { bgcolor: '#F97316' },
                  }}
                />
                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                  The warehouse manager needs to approve this lot from their Warehouse Portal before you can proceed.
                </Typography>
              </>
            )}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={loadLot}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              >
                Refresh Status
              </Button>
            </Box>
          </Box>
        );

      case 3: // Find Logistics Partner
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="success" sx={{ borderRadius: '10px', mb: 2 }}>
              Warehouse has approved this lot! You can now find a logistics partner.
            </Alert>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              Browse logistics companies, compare services, and share this lot for quotations.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/logistics')}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
              >
                Browse Partners
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Send />}
                disabled={actionLoading}
                onClick={handleShareWithLogistics}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              >
                Share Lot for Quotes
              </Button>
            </Box>
          </Box>
        );

      case 4: // Select Partner
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              This lot has been shared with logistics partners. Wait for quotations, then compare and select one.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<RequestQuote />}
                onClick={() => navigate('/quotations')}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
              >
                View Quotations
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={loadLot}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              >
                Refresh
              </Button>
            </Box>
            {lot?.assigned_logistics_name && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: '10px' }}>
                Partner selected: <strong>{lot.assigned_logistics_name}</strong>
              </Alert>
            )}
          </Box>
        );

      case 5: // Generate Shipment
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" sx={{ color: '#6B7280', mb: 2 }}>
              A logistics partner has been selected. Generate a shipment record to begin dispatch preparations.
            </Typography>
            <Button
              variant="contained"
              size="small"
              disabled={actionLoading}
              onClick={handleGenerateShipment}
              startIcon={actionLoading ? <CircularProgress size={16} /> : <LocalShipping />}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
            >
              Generate Shipment
            </Button>
          </Box>
        );

      case 6: // Driver Loading Verification
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ borderRadius: '10px', mb: 2 }}>
              Shipment <strong>{shipment?.shipment_number || 'generated'}</strong>. Waiting for the assigned driver to verify the parcels during loading.
            </Alert>
          </Box>
        );

      case 7: // Dock Reservation
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ borderRadius: '10px', mb: 2 }}>
              Waiting for Logistics Partner to request a dock reservation for this shipment.
            </Alert>
          </Box>
        );

      case 8: // Dock Approval
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ borderRadius: '10px', mb: 2 }}>
              Waiting for Warehouse Admin to approve the requested dock reservation.
            </Alert>
          </Box>
        );

      case 9: // Dispatch Shipment
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

      case 10: // Warehouse Receiving
        return (
          <Box sx={{ py: 2 }}>
            <Alert severity="success" sx={{ borderRadius: '10px', mb: 2 }}>
              Shipment is in transit or has arrived. The destination warehouse will verify the parcels upon receiving.
            </Alert>
            <Box sx={{ my: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Live Tracking Location</Typography>
              <SimpleMap />
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Map />}
              onClick={() => navigate(`/shipments/${shipment?.id}`)}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              Track Shipment Status
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  /* ── Loading state ───────────────────────────────────────────── */
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#F97316' }} />
      </Box>
    );
  }

  if (!lot) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" sx={{ color: '#6B7280' }}>Lot not found</Typography>
        <Button onClick={() => navigate('/lots')} sx={{ mt: 2 }}>← Back to Lots</Button>
      </Box>
    );
  }

  /* ── Main render ─────────────────────────────────────────────── */
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/lots')} sx={{ bgcolor: '#FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#332922' }}>
              {lot.lot_number}
            </Typography>
            <Chip
              label={statusCosmetic.label}
              size="small"
              sx={{ bgcolor: statusCosmetic.bg, color: statusCosmetic.color, fontWeight: 700, borderRadius: '8px' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.3 }}>
            {lot.factory_name} → {lot.destination_name}
            {lot.expected_dispatch_date && ` · Dispatch: ${lot.expected_dispatch_date}`}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={loadLot}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
        >
          Refresh
        </Button>
      </Box>

      {/* Feedback alerts */}
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: '12px' }}>{success}</Alert>}

      {/* Progress bar */}
      <Card sx={{ mb: 3, borderRadius: '20px', overflow: 'hidden' }}>
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#332922' }}>
              Workflow Progress
            </Typography>
            <Typography variant="caption" sx={{ color: '#8A7F75', fontWeight: 600 }}>
              Step {currentStep + 1} of {WORKFLOW_STEPS.length}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((currentStep + 1) / WORKFLOW_STEPS.length) * 100}
            sx={{
              height: 8, borderRadius: 4,
              bgcolor: '#F3F4F6',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: 'linear-gradient(90deg, #F97316 0%, #EA580C 100%)',
              },
            }}
          />
        </Box>
        {/* Step indicators */}
        <Box sx={{ display: 'flex', px: 2, py: 1.5, gap: 0.5, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
          {WORKFLOW_STEPS.map((step, idx) => (
            <Tooltip key={step.key} title={step.label}>
              <Box sx={{
                flex: '0 0 auto',
                px: 1.5, py: 0.5,
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'default',
                bgcolor: idx < currentStep ? '#D1FAE5' : idx === currentStep ? '#FFF7ED' : '#F9FAFB',
                color: idx < currentStep ? '#059669' : idx === currentStep ? '#EA580C' : '#D1D5DB',
                border: idx === currentStep ? '1.5px solid #F97316' : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                {step.label}
              </Box>
            </Tooltip>
          ))}
        </Box>
      </Card>

      {/* Vertical Stepper */}
      <Card sx={{ borderRadius: '20px', p: { xs: 2, md: 3 } }}>
        <Stepper activeStep={currentStep} orientation="vertical" sx={{
          '& .MuiStepConnector-line': {
            borderColor: '#E5E7EB',
            borderLeftWidth: 2,
            minHeight: 20,
          },
        }}>
          {WORKFLOW_STEPS.map((step, idx) => (
            <Step key={step.key} expanded={idx === currentStep}>
              <StepLabel
                StepIconComponent={() => renderStepIcon(idx)}
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: idx === currentStep ? 700 : idx < currentStep ? 600 : 400,
                    color: idx === currentStep ? '#332922' : idx < currentStep ? '#059669' : '#9CA3AF',
                    fontSize: '0.9rem',
                  },
                }}
              >
                {step.label}
              </StepLabel>
              <StepContent
                TransitionProps={{ unmountOnExit: false }}
                sx={{
                  borderLeftWidth: 2,
                  borderColor: '#E5E7EB',
                  ml: '18px',
                  pl: 3,
                }}
              >
                {renderStepContent(idx)}
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Card>
    </Box>
  );
}
