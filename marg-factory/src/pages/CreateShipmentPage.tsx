import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Stepper, Step, StepLabel,
  Button, TextField, MenuItem, Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useMutation, useQuery } from '@tanstack/react-query';
import { shipmentsApi, fleetApi } from '@/api/endpoints';

const STEPS = ['Destination', 'Shipment Details', 'Schedule', 'Cargo Info', 'Review'];

export default function CreateShipmentPage() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    destination_warehouse: '',
    shipment_type: 'FINISHED_GOODS',
    priority: 'MEDIUM',
    expected_dispatch_time: '',
    expected_arrival_time: '',
    cargo_description: '',
    weight_kg: '',
    special_instructions: '',
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => fleetApi.listWarehouses(),
  });
  const warehouses = warehousesData?.data?.results ?? [];

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const createMutation = useMutation({
    mutationFn: () => shipmentsApi.create({
      destination_warehouse: Number(form.destination_warehouse),
      shipment_type: form.shipment_type,
      priority: form.priority,
      expected_dispatch_time: form.expected_dispatch_time || undefined,
      expected_arrival_time: form.expected_arrival_time || undefined,
      cargo_description: form.cargo_description || undefined,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
      special_instructions: form.special_instructions || undefined,
    }),
    onSuccess: (res) => {
      const id = res.data?.data?.id ?? res.data?.id;
      navigate(`/shipments/${id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create shipment');
    },
  });

  const canNext = () => {
    if (activeStep === 0) return !!form.destination_warehouse;
    return true;
  };

  const handleNext = () => {
    if (activeStep === STEPS.length - 1) {
      createMutation.mutate();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const selectedWarehouse = warehouses.find((w: any) => w.id === Number(form.destination_warehouse));

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3 }}>Create New Shipment</Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Step Content */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Select Destination Warehouse</Typography>
              <TextField select fullWidth label="Warehouse" value={form.destination_warehouse}
                onChange={(e) => update('destination_warehouse', e.target.value)}>
                {warehouses.map((w: any) => (
                  <MenuItem key={w.id} value={w.id}>{w.name} — {w.city || w.address_line1}</MenuItem>
                ))}
              </TextField>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Shipment Details</Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField select fullWidth label="Shipment Type" value={form.shipment_type}
                    onChange={(e) => update('shipment_type', e.target.value)}>
                    <MenuItem value="RAW_MATERIAL">Raw Material</MenuItem>
                    <MenuItem value="FINISHED_GOODS">Finished Goods</MenuItem>
                    <MenuItem value="RETURN_LOAD">Return Load</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField select fullWidth label="Priority" value={form.priority}
                    onChange={(e) => update('priority', e.target.value)}>
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="CRITICAL">Critical</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Schedule</Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField fullWidth label="Expected Dispatch" type="datetime-local"
                    value={form.expected_dispatch_time} onChange={(e) => update('expected_dispatch_time', e.target.value)}
                    InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth label="Expected Arrival" type="datetime-local"
                    value={form.expected_arrival_time} onChange={(e) => update('expected_arrival_time', e.target.value)}
                    InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Cargo Information</Typography>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField fullWidth label="Cargo Description" multiline rows={2}
                    value={form.cargo_description} onChange={(e) => update('cargo_description', e.target.value)} />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth label="Weight (kg)" type="number"
                    value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth label="Special Instructions" multiline rows={2}
                    value={form.special_instructions} onChange={(e) => update('special_instructions', e.target.value)} />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 4 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Review & Confirm</Typography>
              <Box sx={{ bgcolor: '#F9FAFB', borderRadius: 2, p: 2 }}>
                {[
                  ['Destination', selectedWarehouse?.name || '—'],
                  ['Type', form.shipment_type.replace(/_/g, ' ')],
                  ['Priority', form.priority],
                  ['Cargo', form.cargo_description || '—'],
                  ['Weight', form.weight_kg ? `${form.weight_kg} kg` : '—'],
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>{label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Navigation */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={() => setActiveStep(prev => prev - 1)}>
              Back
            </Button>
            <Button variant="contained" onClick={handleNext} disabled={!canNext() || createMutation.isPending}>
              {activeStep === STEPS.length - 1 ? 'Create Shipment' : 'Next'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
