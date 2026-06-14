import React, { useState, useEffect } from 'react';
import { Save } from '@mui/icons-material';
import { Box, Typography, Button, Card, TextField, Select, MenuItem, FormControl, InputLabel, Divider } from '@mui/material';
import api from '@/api/client';

const OrganizationSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone_number: '', address: '', city: '', state: '', country: '',
    industry_type: 'FMCG', factory_size: 'Medium', daily_volume: '50-200'
  });

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const userRes = await api.get('/auth/me/');
        const userOrgId = userRes.data.data.organization;
        if (!userOrgId) return;
        setOrgId(userOrgId);
        
        const res = await api.get(`/organizations/${userOrgId}/`);
        const org = res.data;
        setFormData({
          name: org.name || '', email: org.email || '', phone_number: org.phone_number || '',
          address: org.address || '', city: org.city || '', state: org.state || '', country: org.country || '',
          industry_type: org.metadata?.industry_type || 'FMCG',
          factory_size: org.metadata?.factory_size || 'Medium',
          daily_volume: org.metadata?.daily_volume || '50-200'
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, []);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    try {
      await api.patch(`/organizations/${orgId}/`, {
        name: formData.name, email: formData.email, phone_number: formData.phone_number,
        address: formData.address, city: formData.city, state: formData.state, country: formData.country,
        metadata: {
          industry_type: formData.industry_type,
          factory_size: formData.factory_size,
          daily_volume: formData.daily_volume
        }
      });
      alert('Settings updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Box sx={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181B' }}>Organization Settings</Typography>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>Update your factory profile and configuration.</Typography>
      </Box>

      <Card sx={{ p: 4, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>General Information</Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>Public information displayed to logistics partners.</Typography>
            </Box>
            <Box sx={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField required label="Factory Name" name="name" value={formData.name} onChange={handleChange} size="small" sx={{ gridColumn: 'span 2' }} />
              <TextField label="Email address" name="email" value={formData.email} onChange={handleChange} size="small" />
              <TextField label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} size="small" />
              <FormControl size="small" sx={{ gridColumn: 'span 2' }}>
                <InputLabel>Industry Type</InputLabel>
                <Select name="industry_type" value={formData.industry_type} onChange={handleChange} label="Industry Type">
                  {['FMCG', 'Pharmaceutical', 'Electronics', 'Automobile', 'Textile', 'Manufacturing', 'Chemicals', 'Food & Beverage', 'Other'].map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Location</Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>Physical location of the primary factory.</Typography>
            </Box>
            <Box sx={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField label="Address" name="address" value={formData.address} onChange={handleChange} size="small" sx={{ gridColumn: 'span 2' }} />
              <TextField label="City" name="city" value={formData.city} onChange={handleChange} size="small" />
              <TextField label="State / Province" name="state" value={formData.state} onChange={handleChange} size="small" />
              <TextField label="Country" name="country" value={formData.country} onChange={handleChange} size="small" sx={{ gridColumn: 'span 2' }} />
            </Box>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Capacity</Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>Helps logistics partners match capabilities.</Typography>
            </Box>
            <Box sx={{ flex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl size="small">
                <InputLabel>Factory Size</InputLabel>
                <Select name="factory_size" value={formData.factory_size} onChange={handleChange} label="Factory Size">
                  {['Small', 'Medium', 'Large'].map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Daily Volume</InputLabel>
                <Select name="daily_volume" value={formData.daily_volume} onChange={handleChange} label="Daily Volume">
                  {['1–50', '50–200', '200–500', '500+'].map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <Button type="submit" variant="contained" disabled={saving} startIcon={<Save />} sx={{ bgcolor: '#EA580C', '&:hover': { bgcolor: '#C2410C' }, fontWeight: 600 }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </form>
      </Card>
    </Box>
  );
};

export default OrganizationSettingsPage;
