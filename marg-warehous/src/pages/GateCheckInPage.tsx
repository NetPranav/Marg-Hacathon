import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Checkbox, FormControlLabel, TextField, alpha, Alert } from '@mui/material';
import { MeetingRoom, LocalShipping, Person, QrCode, Badge, FolderOpen } from '@mui/icons-material';
import { shipmentsApi } from '@/api/endpoints';

const ORANGE = '#E8700A';

const CHECKLIST_ITEMS = [
  { id: 'vehicle', label: 'Vehicle Number Verified', icon: <LocalShipping fontSize="small" /> },
  { id: 'driver', label: 'Driver Identity Verified', icon: <Person fontSize="small" /> },
  { id: 'shipment', label: 'Shipment ID Verified', icon: <QrCode fontSize="small" /> },
  { id: 'dock', label: 'Dock Reservation Verified', icon: <Badge fontSize="small" /> },
  { id: 'docs', label: 'Required Documentation Available', icon: <FolderOpen fontSize="small" /> },
];

export default function GateCheckInPage() {
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [vehicleId, setVehicleId] = useState('');
  const [shipments, setShipments] = useState<any[]>([]);
  const [foundShipment, setFoundShipment] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    shipmentsApi.list().then(res => {
      setShipments(Array.isArray(res.data) ? res.data : res.data.results || []);
    }).catch(err => console.error(err));
  }, []);

  const handlePullRecords = () => {
    const found = shipments.find(s => 
      s.truck_reg?.toLowerCase() === vehicleId.toLowerCase() && 
      s.status === 'ARRIVED_AT_GATE'
    );
    if (found) {
      setFoundShipment(found);
      setError('');
    } else {
      setFoundShipment(null);
      setError('No pending shipment found for this vehicle plate.');
    }
  };

  const allChecked = CHECKLIST_ITEMS.every(item => checks[item.id]);

  const toggleCheck = (id: string) => {
    setChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApprove = async () => {
    if (!foundShipment) return;
    try {
      await shipmentsApi.approveGateEntry(foundShipment.id);
      alert("Vehicle verified and approved! The dock is now occupied. Proceed to Inbound Yard.");
      setVehicleId('');
      setFoundShipment(null);
      setChecks({});
      
      // refresh list
      const res = await shipmentsApi.list();
      setShipments(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to approve gate entry.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Gate Check-In
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Digitize vehicle verification and authorize warehouse entry.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '12px',
                  bgcolor: alpha(ORANGE, 0.1), color: ORANGE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MeetingRoom />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>Arriving Vehicle</Typography>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>Scan or enter vehicle plate</Typography>
                </Box>
              </Box>

              <TextField 
                fullWidth 
                label="Vehicle Registration Plate" 
                variant="outlined" 
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button 
                variant="contained" 
                fullWidth 
                onClick={handlePullRecords}
                disabled={!vehicleId}
                sx={{ bgcolor: '#0F172A', '&:hover': { bgcolor: '#1E293B' }, py: 1.5, fontWeight: 700, borderRadius: 2 }}
              >
                Pull Vehicle Records
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%', opacity: foundShipment ? 1 : 0.6, pointerEvents: foundShipment ? 'auto' : 'none' }}>
            <CardContent sx={{ p: 3 }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              
              {foundShipment && (
                <Box sx={{ mb: 3, p: 2, bgcolor: alpha(ORANGE, 0.05), borderRadius: 2, border: `1px solid ${alpha(ORANGE, 0.2)}` }}>
                  <Typography variant="subtitle2" sx={{ color: ORANGE, fontWeight: 700, mb: 1 }}>Shipment Found</Typography>
                  <Typography variant="body2"><strong>Shipment ID:</strong> {foundShipment.shipment_number}</Typography>
                  <Typography variant="body2"><strong>Driver:</strong> {foundShipment.driver_name}</Typography>
                  <Typography variant="body2"><strong>Factory:</strong> {foundShipment.factory_name}</Typography>
                </Box>
              )}

              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>
                Verification Checklist
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 4 }}>
                {CHECKLIST_ITEMS.map((item) => (
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
                <Grid item xs={12} sm={4}>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={handleApprove}
                    disabled={!allChecked}
                    sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, py: 1.5, fontWeight: 700 }}
                  >
                    Approve Entry
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ color: '#F59E0B', borderColor: alpha('#F59E0B', 0.5), py: 1.5, fontWeight: 700 }}
                  >
                    Escalate Issue
                  </Button>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    sx={{ color: '#EF4444', borderColor: alpha('#EF4444', 0.5), py: 1.5, fontWeight: 700 }}
                  >
                    Redirect Vehicle
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
