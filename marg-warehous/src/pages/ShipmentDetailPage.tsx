import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid2 as Grid, Chip, Stepper, Step,
  StepLabel, StepContent, CircularProgress, alpha, Button, IconButton,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccessTime, LocalShipping, LocationOn, Speed, ArrowBack } from '@mui/icons-material';
import { shipmentsApi } from '@/api/endpoints';
import CoordinationPanel from '@/components/chat/CoordinationPanel';

const ORANGE = '#E8700A';

const STATUS_ORDER = [
  'CREATED', 'READY_FOR_ASSIGNMENT', 'TRUCK_ASSIGNED', 'DRIVER_ASSIGNED',
  'DOCK_RESERVED', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT',
  'APPROACHING_DESTINATION', 'ARRIVED_AT_GATE', 'RECEIVING_IN_PROGRESS', 'SLOTTING_IN_PROGRESS', 'COMPLETED',
];

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const shipmentId = Number(id);

  const { data: shipmentData, isLoading } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: () => shipmentsApi.get(shipmentId),
  });

  const { data: etaData } = useQuery({
    queryKey: ['eta', shipmentId],
    queryFn: () => shipmentsApi.eta(shipmentId),
    retry: false,
  });

  const { data: timelineData } = useQuery({
    queryKey: ['timeline', shipmentId],
    queryFn: () => shipmentsApi.timeline(shipmentId),
    retry: false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['shipment', shipmentId] });
    queryClient.invalidateQueries({ queryKey: ['incoming-all'] });
  };

  const arrivalMut = useMutation({ mutationFn: () => shipmentsApi.markArrived(shipmentId), onSuccess: invalidate });
  const unloadMut = useMutation({ mutationFn: () => shipmentsApi.startUnloading(shipmentId), onSuccess: invalidate });
  const completeMut = useMutation({ mutationFn: () => shipmentsApi.complete(shipmentId), onSuccess: invalidate });

  const s = shipmentData?.data?.data ?? shipmentData?.data;
  const eta = etaData?.data?.data;
  const timeline = timelineData?.data?.data ?? timelineData?.data?.results ?? [];

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  if (!s) return <Typography>Shipment not found</Typography>;

  const statusIndex = STATUS_ORDER.indexOf(s.status);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton onClick={() => navigate('/shipments')} sx={{ color: '#64748B', '&:hover': { color: ORANGE } }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>Shipment Details</Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8' }}>{s.shipment_number}</Typography>
        </Box>
      </Box>
      <Grid container spacing={2}>
        {/* Left: Details */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">{s.shipment_number}</Typography>
                <Chip label={s.status?.replace(/_/g, ' ')} sx={{ bgcolor: alpha(ORANGE, 0.1), color: ORANGE, fontWeight: 700 }} />
              </Box>

              <Grid container spacing={2}>
                {[
                  { icon: <LocalShipping sx={{ color: ORANGE }} />, label: 'Type', value: s.shipment_type?.replace(/_/g, ' ') },
                  { icon: <Speed sx={{ color: '#F59E0B' }} />, label: 'Priority', value: s.priority },
                  { icon: <LocationOn sx={{ color: '#EF4444' }} />, label: 'From', value: s.factory_name },
                  { icon: <LocationOn sx={{ color: '#22C55E' }} />, label: 'To', value: s.warehouse_name },
                ].map((item) => (
                  <Grid key={item.label} size={{ xs: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                      {item.icon}
                      <Box>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{item.label}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1A1A1A' }}>{item.value || '—'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* ETA */}
          {eta && (
            <Card sx={{ mb: 2, border: '1px solid', borderColor: alpha(ORANGE, 0.2) }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Live ETA Prediction</Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'Distance Left', value: `${eta.remaining_distance_km} km`, color: ORANGE },
                    { label: 'Confidence', value: `${(eta.confidence * 100).toFixed(0)}%`, color: '#3B82F6' },
                    { label: 'Delay Risk', value: `${(eta.delay_probability * 100).toFixed(0)}%`, color: eta.delay_probability > 0.5 ? '#EF4444' : '#22C55E' },
                  ].map((item) => (
                    <Grid key={item.label} size={{ xs: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: item.color }}>{item.value}</Typography>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>{item.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          <CoordinationPanel shipment={s} onUpdate={invalidate} />
        </Grid>

        {/* Right: Timeline */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Shipment Timeline</Typography>
              {timeline.length > 0 ? (
                <Stepper orientation="vertical" activeStep={-1}>
                  {timeline.map((event: any, i: number) => (
                    <Step key={i} completed>
                      <StepLabel
                        StepIconProps={{ sx: { color: ORANGE } }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{event.event_type?.replace(/_/g, ' ')}</Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="caption" sx={{ color: '#6B7280' }}>{event.description}</Typography>
                        <Typography variant="caption" display="block" sx={{ color: '#9CA3AF', mt: 0.5 }}>
                          {new Date(event.timestamp).toLocaleString()}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              ) : (
                <Box>
                  <Stepper orientation="vertical" activeStep={statusIndex}>
                    {STATUS_ORDER.filter((_, i) => i <= Math.max(statusIndex, 0) + 2).map((status, i) => (
                      <Step key={status} completed={i <= statusIndex}>
                        <StepLabel>
                          <Typography variant="body2" sx={{ fontWeight: i === statusIndex ? 700 : 400, color: i === statusIndex ? '#8B3A0E' : undefined }}>
                            {status.replace(/_/g, ' ')}
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
