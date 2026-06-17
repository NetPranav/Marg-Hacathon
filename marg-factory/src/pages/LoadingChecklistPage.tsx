import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  Checkbox, FormControlLabel, Alert, Divider, CircularProgress, Tooltip, IconButton,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ChecklistRtl, CheckCircle, RadioButtonUnchecked,
  LocalShipping, RocketLaunch, Warning, Cancel, ErrorOutline
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { shipmentsApi } from '../api/endpoints';

const CHECKLIST_ITEMS = [
  { id: 'lots_loaded', label: 'Lots Loaded', mandatory: true },
  { id: 'quantities_verified', label: 'Lot Quantities Verified', mandatory: true },
  { id: 'seal_applied', label: 'Seal Applied', mandatory: false },
  { id: 'documents_attached', label: 'Documents Attached', mandatory: true },
  { id: 'driver_verified', label: 'Driver Verified', mandatory: true },
];

export default function LoadingChecklistPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState<Record<string, 'pending' | 'completed' | 'failed'>>({});
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    const initStatuses: Record<string, 'pending' | 'completed' | 'failed'> = {};
    CHECKLIST_ITEMS.forEach(i => initStatuses[i.id] = 'pending');
    setStatuses(initStatuses);
  }, []);

  useEffect(() => {
    if (!id) return;
    shipmentsApi.get(Number(id))
      .then(res => setShipment(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggleStatus = (itemId: string, evt: React.MouseEvent) => {
    evt.stopPropagation();
    setStatuses(prev => {
      const curr = prev[itemId] || 'pending';
      let next: 'pending' | 'completed' | 'failed' = 'completed';
      if (curr === 'pending') next = 'completed';
      else if (curr === 'completed') next = 'failed';
      else next = 'pending';
      return { ...prev, [itemId]: next };
    });
  };

  const markFailed = (itemId: string, evt: React.MouseEvent) => {
    evt.stopPropagation();
    setStatuses(prev => ({ ...prev, [itemId]: 'failed' }));
  };

  const mandatoryItems = CHECKLIST_ITEMS.filter(i => i.mandatory);
  const allMandatoryChecked = mandatoryItems.every(i => statuses[i.id] === 'completed');
  const checkedCount = CHECKLIST_ITEMS.filter(i => statuses[i.id] === 'completed').length;

  const handleDispatch = async () => {
    if (!id || !allMandatoryChecked) return;
    setDispatching(true);
    try {
      await shipmentsApi.markLoadingComplete(Number(id));
      alert('Shipment marked ready for transit!');
      navigate('/shipment-readiness');
    } catch (e) {
      console.error(e);
      alert('Error dispatching shipment.');
    } finally {
      setDispatching(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Loading Checklist
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
            Complete all mandatory checks before dispatching shipment {shipment?.shipment_number || id}.
          </Typography>
        </Box>
        <Chip
          label={`${checkedCount}/${CHECKLIST_ITEMS.length} Complete`}
          sx={{
            fontWeight: 700, borderRadius: '10px', fontSize: '0.85rem', py: 2,
            bgcolor: allMandatoryChecked ? '#D1FAE5' : '#FEF3C7',
            color: allMandatoryChecked ? '#059669' : '#D97706',
          }}
        />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ChecklistRtl sx={{ color: '#F97316' }} />
                Pre-Dispatch Verification
              </Typography>

              {!allMandatoryChecked && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: '10px' }}>
                  Complete all mandatory items (marked with ★) to enable dispatch.
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {CHECKLIST_ITEMS.map(item => {
                  const s = statuses[item.id] || 'pending';
                  const isCompleted = s === 'completed';
                  const isFailed = s === 'failed';

                  return (
                    <Box
                      key={item.id}
                      onClick={(e) => toggleStatus(item.id, e)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 2, p: 2,
                        borderRadius: '12px', cursor: 'pointer',
                        bgcolor: isCompleted ? 'rgba(34, 197, 94, 0.06)' : isFailed ? 'rgba(239, 68, 68, 0.06)' : 'transparent',
                        border: isCompleted ? '1px solid rgba(34, 197, 94, 0.2)' : isFailed ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid transparent',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: isCompleted ? 'rgba(34, 197, 94, 0.1)' : isFailed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.02)' },
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle sx={{ color: '#22C55E', fontSize: 24 }} />
                      ) : isFailed ? (
                        <Cancel sx={{ color: '#EF4444', fontSize: 24 }} />
                      ) : (
                        <RadioButtonUnchecked sx={{ color: '#D1D5DB', fontSize: 24 }} />
                      )}
                      <Typography sx={{
                        flex: 1, fontWeight: 600, fontSize: '0.9rem',
                        color: isCompleted ? '#059669' : isFailed ? '#DC2626' : '#332922',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                      }}>
                        {item.label}
                      </Typography>
                      {item.mandatory && (
                        <Typography sx={{ color: '#F97316', fontSize: '0.8rem', fontWeight: 700, mr: 1 }}>★</Typography>
                      )}
                      
                      <Chip 
                        label={s.toUpperCase()} 
                        size="small" 
                        sx={{ 
                          height: 20, fontSize: '0.65rem', fontWeight: 800, borderRadius: '6px',
                          bgcolor: isCompleted ? '#D1FAE5' : isFailed ? '#FEE2E2' : '#F3F4F6',
                          color: isCompleted ? '#059669' : isFailed ? '#DC2626' : '#6B7280'
                        }} 
                      />

                      {s !== 'failed' && (
                        <Tooltip title="Mark as Failed">
                          <IconButton size="small" onClick={(e) => markFailed(item.id, e)}>
                            <ErrorOutline fontSize="small" sx={{ color: '#EF4444' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Shipment Summary</Typography>
              {[
                { label: 'Shipment #', value: shipment?.shipment_number || 'N/A' },
                { label: 'Truck', value: shipment?.truck_plate || 'Not assigned' },
                { label: 'Driver', value: shipment?.driver_name || 'Not assigned' },
                { label: 'Status', value: shipment?.status || 'N/A' },
              ].map(row => (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <Typography variant="body2" sx={{ color: '#8A7F75' }}>{row.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#332922' }}>{row.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>

          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={dispatching ? <CircularProgress size={20} color="inherit" /> : <RocketLaunch />}
            disabled={!allMandatoryChecked || dispatching}
            onClick={handleDispatch}
            sx={{
              borderRadius: '14px', py: 1.5, fontSize: '1rem', fontWeight: 700,
              background: allMandatoryChecked
                ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                : undefined,
            }}
          >
            {dispatching ? 'Processing...' : 'Mark Loading Complete'}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
