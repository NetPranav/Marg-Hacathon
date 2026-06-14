import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, TextField, Button, Stepper, Step, StepLabel, 
  Card, Grid, MenuItem, Alert, CircularProgress, Select, InputLabel, FormControl, alpha
} from '@mui/material';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';

const steps = ['Organization', 'Warehouse', 'Location', 'Capacity & Layout'];

const ORANGE = '#E8700A';
const BROWN = '#8B3A0E';

export default function RegisterWarehousePage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone_number: '',
    password: '',
    first_name: '',
    last_name: '',

    warehouse_name: '',
    warehouse_type: 'DESTINATION_WAREHOUSE',
    operating_hours: '24/7',
    
    country: '',
    state: '',
    city: '',
    postal_code: '',
    full_address: '',
    
    capacity: 10000,
    max_concurrent_trucks: 5,
    num_racks: 4,
    num_shelves: 4,
    num_docks: 3,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    setFormData({
      ...formData,
      [e.target.name as string]: e.target.value
    });
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authApi.registerWarehouse(formData);
      if (response.data.success) {
        const { user, access, refresh } = response.data.data;
        login(user, access, refresh);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register warehouse. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Admin First Name" name="first_name" value={formData.first_name} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Admin Last Name" name="last_name" value={formData.last_name} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Admin Email (Login)" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Warehouse Facility Name" name="warehouse_name" value={formData.warehouse_name} onChange={handleChange} required />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Warehouse Type</InputLabel>
                <Select name="warehouse_type" value={formData.warehouse_type} onChange={handleChange as any} label="Warehouse Type">
                  <MenuItem value="DESTINATION_WAREHOUSE">Destination Warehouse</MenuItem>
                  <MenuItem value="TRANSIT_WAREHOUSE">Transit Warehouse</MenuItem>
                  <MenuItem value="DISTRIBUTION_CENTER">Distribution Center</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Operating Hours" name="operating_hours" value={formData.operating_hours} onChange={handleChange} helperText="e.g., 24/7, Mon-Fri 9AM-5PM" />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField fullWidth label="Country" name="country" value={formData.country} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="State/Province" name="state" value={formData.state} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Postal Code" name="postal_code" value={formData.postal_code} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Address" name="full_address" value={formData.full_address} onChange={handleChange} multiline rows={3} />
            </Grid>
          </Grid>
        );
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Storage Capacity (sqm)" name="capacity" value={formData.capacity} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Max Concurrent Trucks" name="max_concurrent_trucks" value={formData.max_concurrent_trucks} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: '#94A3B8' }}>Initial 3D Layout Setup</Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="number" label="Initial Racks" name="num_racks" value={formData.num_racks} onChange={handleChange} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="number" label="Shelves per Rack" name="num_shelves" value={formData.num_shelves} onChange={handleChange} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type="number" label="Dock Bays" name="num_docks" value={formData.num_docks} onChange={handleChange} />
            </Grid>
          </Grid>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #FBF9F7 0%, #FFF5EE 40%, #FBF9F7 100%)',
      p: 3, 
      position: 'relative', 
      overflow: 'hidden',
    }}>
      {/* Decorative elements */}
      <Box sx={{
        position: 'absolute', top: '5%', right: '8%', width: 400, height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(ORANGE, 0.06)} 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(BROWN, 0.04)} 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />
      {/* Grid pattern */}
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(${alpha(ORANGE, 0.015)} 1px, transparent 1px),
          linear-gradient(90deg, ${alpha(ORANGE, 0.015)} 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      <Card sx={{ 
        p: { xs: 3, sm: 4.5 }, 
        maxWidth: 700, 
        width: '100%', 
        position: 'relative',
        border: `1px solid ${alpha(ORANGE, 0.06)}`,
        boxShadow: `0 8px 40px ${alpha(ORANGE, 0.06)}, 0 2px 8px rgba(0,0,0,0.02)`,
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '16px', mx: 'auto', mb: 2,
            background: `linear-gradient(135deg, ${ORANGE} 0%, ${BROWN} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 24,
            boxShadow: `0 8px 24px ${alpha(ORANGE, 0.3)}`,
          }}>
            M
          </Box>
          <Typography sx={{
            fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2,
            background: `linear-gradient(135deg, ${BROWN} 0%, ${ORANGE} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Onboard Your Warehouse
          </Typography>
          <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
            Join the Marg Global Network
          </Typography>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { color: '#94A3B8' } }}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button 
            disabled={activeStep === 0} 
            onClick={handleBack} 
            sx={{ color: '#94A3B8' }}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmit} 
                disabled={loading}
                sx={{ bgcolor: '#E8700A', '&:hover': { bgcolor: '#C25A08' } }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Complete Registration'}
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleNext}
                sx={{ bgcolor: '#E8700A', '&:hover': { bgcolor: '#C25A08' } }}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Already have an account?{' '}
              <Button color="primary" onClick={() => navigate('/login')} sx={{ textTransform: 'none', color: '#E8700A' }}>
                Sign In
              </Button>
            </Typography>
        </Box>
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3.5, color: '#CBD5E1', fontSize: '0.75rem' }}>
          Marg — Intelligent Warehouse Management
        </Typography>
      </Card>
    </Box>
  );
}
