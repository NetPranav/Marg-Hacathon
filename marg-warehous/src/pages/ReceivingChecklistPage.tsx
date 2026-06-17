import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, Checkbox, alpha, CircularProgress, Alert } from '@mui/material';
import { ChecklistRtl, Inventory, Layers, BrokenImage, VerifiedUser, WarningAmber } from '@mui/icons-material';
import { shipmentsApi } from '@/api/endpoints';

const ORANGE = '#E8700A';

const RECEIVING_CHECKS = [
  { id: 'qty', label: 'Lot Quantities Verified', icon: <Inventory fontSize="small" /> },
  { id: 'count', label: 'Parcel Count Verified', icon: <Layers fontSize="small" /> },
  { id: 'damages', label: 'Damages Recorded (if any)', icon: <BrokenImage fontSize="small" /> },
  { id: 'seal', label: 'Seal Integrity Verified', icon: <VerifiedUser fontSize="small" /> },
  { id: 'special', label: 'Special Handling Requirements Verified', icon: <WarningAmber fontSize="small" /> },
];

export default function ReceivingChecklistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shipmentId = id || '';

  const allChecked = RECEIVING_CHECKS.every(item => checks[item.id]);

  const toggleCheck = (id: string) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleComplete = async () => {
    if (!shipmentId) return;
    setLoading(true);
    setError('');
    try {
      await shipmentsApi.complete(Number(shipmentId));
      navigate(`/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete receiving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Receiving Checklist
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Inspect incoming cargo and verify accuracy before accepting goods into inventory.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '12px',
                  bgcolor: alpha(ORANGE, 0.1), color: ORANGE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ChecklistRtl />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>Shipment Context</Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Shipment ID: {shipmentId}</Typography>
                </Box>
              </Box>

              <Button 
                variant="contained" 
                fullWidth 
                disabled
                sx={{ bgcolor: '#0F172A', '&.Mui-disabled': { bgcolor: '#0F172A', color: 'white', opacity: 0.7 }, py: 1.5, fontWeight: 700, borderRadius: 2 }}
              >
                Manifest Loaded
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%', opacity: shipmentId ? 1 : 0.6, pointerEvents: shipmentId ? 'auto' : 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Receiving Verification
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
                {RECEIVING_CHECKS.map((item) => (
                  <Box 
                    key={item.id} 
                    onClick={() => toggleCheck(item.id)}
                    sx={{ 
                      display: 'flex', alignItems: 'center', gap: 2, p: 2, 
                      borderRadius: 2, border: '1px solid',
                      borderColor: checks[item.id] ? alpha('#22C55E', 0.5) : '#E2E8F0',
                      bgcolor: checks[item.id] ? alpha('#22C55E', 0.05) : 'transparent',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      '&:hover': { bgcolor: alpha('#F1F5F9', 0.5) }
                    }}
                  >
                    <Checkbox 
                      checked={!!checks[item.id]} 
                      sx={{ p: 0, color: '#CBD5E1', '&.Mui-checked': { color: '#22C55E' } }} 
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: checks[item.id] ? '#0F172A' : '#64748B' }}>
                      {item.icon}
                      <Typography sx={{ fontWeight: checks[item.id] ? 600 : 500 }}>{item.label}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={handleComplete}
                    disabled={!allChecked || loading}
                    startIcon={loading && <CircularProgress size={16} />}
                    sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, py: 1.5, fontWeight: 700 }}
                  >
                    Complete Receiving & Trigger Slotting
                  </Button>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ color: '#EF4444', borderColor: alpha('#EF4444', 0.5), py: 1.5, fontWeight: 700 }}
                  >
                    Raise Exception
                  </Button>
                </Grid>
              </Grid>

            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
