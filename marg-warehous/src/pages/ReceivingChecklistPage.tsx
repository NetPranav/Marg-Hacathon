import { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Checkbox, TextField, alpha } from '@mui/material';
import { ChecklistRtl, Inventory, Layers, BrokenImage, VerifiedUser, WarningAmber } from '@mui/icons-material';

const ORANGE = '#E8700A';

const RECEIVING_CHECKS = [
  { id: 'qty', label: 'Lot Quantities Verified', icon: <Inventory fontSize="small" /> },
  { id: 'count', label: 'Parcel Count Verified', icon: <Layers fontSize="small" /> },
  { id: 'damages', label: 'Damages Recorded (if any)', icon: <BrokenImage fontSize="small" /> },
  { id: 'seal', label: 'Seal Integrity Verified', icon: <VerifiedUser fontSize="small" /> },
  { id: 'special', label: 'Special Handling Requirements Verified', icon: <WarningAmber fontSize="small" /> },
];

export default function ReceivingChecklistPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [shipmentId, setShipmentId] = useState('');

  const allChecked = RECEIVING_CHECKS.every(item => checks[item.id]);

  const toggleCheck = (id: string) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
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
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Enter Shipment ID</Typography>
                </Box>
              </Box>

              <TextField 
                fullWidth 
                label="Shipment ID" 
                variant="outlined" 
                value={shipmentId}
                onChange={(e) => setShipmentId(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button 
                variant="contained" 
                fullWidth 
                disabled={!shipmentId}
                sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' }, py: 1.5, fontWeight: 700, borderRadius: 2 }}
              >
                Load Manifest
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
                    disabled={!allChecked}
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
