import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Button, Stepper,
  Step, StepLabel, StepContent, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Radio, CircularProgress, Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  LocalShipping, Person, DirectionsCar, LocationOn,
  AccessTime, Assignment, PlayArrow, Cancel,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentsApi, fleetApi } from '@/api/endpoints';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/theme/statusColors';
import SimpleMap from '@/components/SimpleMap';

export default function ShipmentDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const shipmentId = Number(id);

  const [truckDialog, setTruckDialog] = useState(false);
  const [driverDialog, setDriverDialog] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<number | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  const { data: shipmentData, isLoading } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: () => shipmentsApi.get(shipmentId),
  });

  const { data: timelineData } = useQuery({
    queryKey: ['shipment-timeline', shipmentId],
    queryFn: () => shipmentsApi.timeline(shipmentId),
  });

  const { data: etaData } = useQuery({
    queryKey: ['shipment-eta', shipmentId],
    queryFn: () => shipmentsApi.eta(shipmentId),
    retry: false,
  });

  const { data: trucksData } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => fleetApi.listTrucks(),
    enabled: truckDialog,
  });

  const { data: driversData } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => fleetApi.listDrivers(),
    enabled: driverDialog,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['shipment', shipmentId] });
    queryClient.invalidateQueries({ queryKey: ['shipment-timeline', shipmentId] });
  };

  const assignTruck = useMutation({
    mutationFn: () => shipmentsApi.assignTruck(shipmentId, selectedTruck!),
    onSuccess: () => { setTruckDialog(false); invalidate(); },
  });

  const assignDriver = useMutation({
    mutationFn: () => shipmentsApi.assignDriver(shipmentId, selectedDriver!),
    onSuccess: () => { setDriverDialog(false); invalidate(); },
  });

  const dispatchMutation = useMutation({
    mutationFn: () => shipmentsApi.dispatch(shipmentId),
    onSuccess: invalidate,
  });

  const s = shipmentData?.data?.data ?? shipmentData?.data;
  const timeline = timelineData?.data?.data ?? [];
  const eta = etaData?.data?.data;
  if (isLoading) return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>;
  if (!s) return <Alert severity="error">Shipment not found</Alert>;

  const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.DRAFT;
  const pc = PRIORITY_COLORS[s.priority] ?? PRIORITY_COLORS.MEDIUM;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontFamily: 'monospace' }}>{s.shipment_number}</Typography>
            <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }} />
            <Chip label={s.priority} size="small" sx={{ bgcolor: pc.bg, color: pc.color }} />
          </Box>
          <Typography variant="body2">{s.factory_name} → {s.warehouse_name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!s.truck_registration && <Button variant="outlined" startIcon={<DirectionsCar />} onClick={() => setTruckDialog(true)}>Assign Truck</Button>}
          {s.truck_registration && !s.driver_name && <Button variant="outlined" startIcon={<Person />} onClick={() => setDriverDialog(true)}>Assign Driver</Button>}
          {s.status === 'LOADING_IN_PROGRESS' && (
            <Button variant="contained" startIcon={<PlayArrow />} onClick={() => window.location.href = `/loading-checklist/${s.id}`}>
              Complete Loading
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2.5}>
        {/* Info Cards */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={2}>
            {/* Shipment Info */}
            <Grid size={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Shipment Information</Typography>
                  <Grid container spacing={2}>
                    {[
                      { icon: <Assignment />, label: 'Type', value: s.shipment_type?.replace(/_/g, ' ') },
                      { icon: <AccessTime />, label: 'Created', value: s.created_at ? new Date(s.created_at).toLocaleDateString() : '—' },
                      { icon: <DirectionsCar />, label: 'Truck', value: s.truck_registration || 'Not assigned' },
                      { icon: <Person />, label: 'Driver', value: s.driver_name || 'Not assigned' },
                      { icon: <LocationOn />, label: 'Destination', value: s.warehouse_name || '—' },
                      { icon: <AccessTime />, label: 'Expected Arrival', value: s.expected_arrival_time ? new Date(s.expected_arrival_time).toLocaleString() : '—' },
                    ].map((item) => (
                      <Grid size={{ xs: 6, md: 4 }} key={item.label}>
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <Box sx={{ color: '#F97316', mt: 0.2 }}>{item.icon}</Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{item.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#18181B' }}>{item.value}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Map Card */}
            <Grid size={12}>
              <Card>
                <CardContent sx={{ p: 0, pb: '0 !important' }}>
                  <SimpleMap />
                </CardContent>
              </Card>
            </Grid>

            {/* ETA Card */}
            {eta && (
              <Grid size={12}>
                <Card sx={{ border: '1px solid', borderColor: eta.delay_probability > 0.5 ? '#FEE2E2' : '#D1FAE5' }}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle1">ETA Prediction</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#18181B' }}>
                        {new Date(eta.predicted_eta).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Distance</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{eta.remaining_distance_km} km</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Confidence</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{(eta.confidence * 100).toFixed(0)}%</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Delay Risk</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: eta.delay_probability > 0.5 ? '#EF4444' : '#22C55E' }}>
                          {(eta.delay_probability * 100).toFixed(0)}%
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Grid>

        {/* Timeline */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Timeline</Typography>
              <Stepper orientation="vertical" activeStep={timeline.length - 1}>
                {[...timeline].reverse().map((evt: any, i: number) => (
                  <Step key={i} completed>
                    <StepLabel
                      StepIconProps={{ sx: { color: '#F97316' } }}
                      optional={<Typography variant="caption">{new Date(evt.timestamp).toLocaleString()}</Typography>}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {evt.event_type_display}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="caption" sx={{ color: '#6B7280' }}>{evt.description}</Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
              {timeline.length === 0 && (
                <Typography variant="body2" sx={{ color: '#9CA3AF', textAlign: 'center', py: 3 }}>No events yet</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Assign Truck Dialog */}
      <Dialog open={truckDialog} onClose={() => setTruckDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Truck</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Registration</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(trucksData?.data?.results ?? []).filter((t: any) => t.status === 'AVAILABLE').map((t: any) => (
                  <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedTruck(t.id)}>
                    <TableCell><Radio checked={selectedTruck === t.id} /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.registration_number}</TableCell>
                    <TableCell>{t.vehicle_type || '—'}</TableCell>
                    <TableCell>{t.capacity_kg} kg</TableCell>
                    <TableCell><Chip label={t.status} size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669' }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTruckDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => assignTruck.mutate()} disabled={!selectedTruck || assignTruck.isPending}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={driverDialog} onClose={() => setDriverDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Driver</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>License</TableCell>
                  <TableCell>Available</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(driversData?.data?.results ?? []).filter((d: any) => d.is_available).map((d: any) => (
                  <TableRow key={d.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedDriver(d.id)}>
                    <TableCell><Radio checked={selectedDriver === d.id} /></TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{d.user_full_name}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{d.license_number}</TableCell>
                    <TableCell><Chip label="Available" size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669' }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDriverDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => assignDriver.mutate()} disabled={!selectedDriver || assignDriver.isPending}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
