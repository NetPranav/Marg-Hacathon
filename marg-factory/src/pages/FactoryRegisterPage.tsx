import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl, CircularProgress, Alert } from '@mui/material';
import api from '@/api/client';

const FactoryRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    company_name: '',
    industry_type: 'FMCG',
    country: 'India',
    state: '',
    city: '',
    address: '',
    pincode: '',
    factory_size: 'Medium',
    daily_volume: '50-200'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register-factory/', formData);
      localStorage.setItem('token', response.data.data.access);
      localStorage.setItem('userRole', response.data.data.user.role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', py: 6, px: { xs: 2, sm: 4, lg: 8 },
      background: 'linear-gradient(135deg, #18181B 0%, #27272A 50%, #18181B 100%)',
    }}>
      <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 1 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', mb: 1 }}>
          Register your Factory
        </Typography>
        <Typography variant="body1" sx={{ color: '#9CA3AF' }}>
          Quick prototype setup — no verification needed
        </Typography>
      </Box>

      <Box sx={{ mx: 'auto', width: '100%', maxWidth: 800, position: 'relative', zIndex: 1 }}>
        <Card sx={{ p: { xs: 3, sm: 5 }, borderRadius: '24px', bgcolor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* Owner Information */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, borderBottom: '1px solid #E5E7EB', pb: 1, mb: 2, color: '#18181B' }}>
                Owner Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField required label="Full Name" name="full_name" onChange={handleChange} size="small" />
                <TextField required label="Email Address" type="email" name="email" onChange={handleChange} size="small" />
                <TextField required label="Phone Number" name="phone_number" onChange={handleChange} size="small" />
                <Box />
                <TextField required label="Password" type="password" name="password" onChange={handleChange} size="small" />
                <TextField required label="Confirm Password" type="password" name="confirm_password" onChange={handleChange} size="small" />
              </Box>
            </Box>

            {/* Company Information */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, borderBottom: '1px solid #E5E7EB', pb: 1, mb: 2, color: '#18181B' }}>
                Company Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField required label="Factory / Company Name" name="company_name" onChange={handleChange} size="small" />
                <FormControl size="small">
                  <InputLabel>Industry Type</InputLabel>
                  <Select name="industry_type" value={formData.industry_type} onChange={handleChange} label="Industry Type">
                    {['FMCG', 'Pharmaceutical', 'Electronics', 'Automobile', 'Textile', 'Manufacturing', 'Chemicals', 'Food & Beverage', 'Other'].map(i => (
                      <MenuItem key={i} value={i}>{i}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Factory Location */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, borderBottom: '1px solid #E5E7EB', pb: 1, mb: 2, color: '#18181B' }}>
                Factory Location
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField required label="Country" name="country" value={formData.country} onChange={handleChange} size="small" />
                <TextField required label="State" name="state" onChange={handleChange} size="small" />
                <TextField required label="City" name="city" onChange={handleChange} size="small" />
                <TextField required label="Pincode" name="pincode" onChange={handleChange} size="small" />
                <TextField required label="Complete Address" name="address" onChange={handleChange} size="small" sx={{ gridColumn: { sm: 'span 2' } }} />
              </Box>
            </Box>

            {/* Facility Information */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, borderBottom: '1px solid #E5E7EB', pb: 1, mb: 2, color: '#18181B' }}>
                Facility Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl size="small">
                  <InputLabel>Factory Size</InputLabel>
                  <Select name="factory_size" value={formData.factory_size} onChange={handleChange} label="Factory Size">
                    {['Small', 'Medium', 'Large'].map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl size="small">
                  <InputLabel>Daily Shipment Volume</InputLabel>
                  <Select name="daily_volume" value={formData.daily_volume} onChange={handleChange} label="Daily Shipment Volume">
                    {['1–50', '50–200', '200–500', '500+'].map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ pt: 2, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Button variant="text" onClick={() => navigate('/login')} sx={{ color: '#6B7280', '&:hover': { color: '#EA580C' } }}>
                Back to Login
              </Button>
              <Button
                type="submit" variant="contained" disabled={loading}
                sx={{
                  px: 4, py: 1.5, fontSize: '1rem', fontWeight: 700, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                  boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
                  '&:hover': { background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)' }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Register Factory'}
              </Button>
            </Box>
          </form>
        </Card>
      </Box>
    </Box>
  );
};

export default FactoryRegisterPage;
