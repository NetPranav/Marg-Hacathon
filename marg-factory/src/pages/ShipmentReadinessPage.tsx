import React from 'react';
import { Box, Typography, Card, CardContent, Button, LinearProgress, Divider, Chip, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { WarningAmber, CheckCircle, AssignmentTurnedIn, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useEffect, useState } from 'react';
import { shipmentsApi } from '../api/endpoints';

const STATUS_ORDER = [
  'DRAFT',
  'WAREHOUSE_APPROVED',
  'LOGISTICS_SELECTED',
  'DRIVER_ASSIGNED',
  'READY_FOR_PICKUP',
  'LOADING_IN_PROGRESS',
  'READY_FOR_TRANSIT',
  'IN_TRANSIT',
  'APPROACHING_DESTINATION',
  'ARRIVED_AT_GATE',
  'RECEIVING_IN_PROGRESS',
  'SLOTTING_IN_PROGRESS',
  'COMPLETED'
];

const getStatusIndex = (st: string) => STATUS_ORDER.indexOf(st);
const isAtLeast = (current: string, target: string) => getStatusIndex(current) >= getStatusIndex(target);

export default function ShipmentReadinessPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispatchingId, setDispatchingId] = useState<number | null>(null);

  const fetchShipments = () => {
    setLoading(true);
    shipmentsApi.list()
      .then(res => setShipments(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleDispatch = async (id: number) => {
    try {
      setDispatchingId(id);
      await shipmentsApi.dispatch(id);
      alert('Shipment dispatched successfully!');
      fetchShipments();
    } catch (e) {
      console.error(e);
      alert('Failed to dispatch shipment.');
    } finally {
      setDispatchingId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Shipment Readiness
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
            Evaluate whether upcoming shipments are ready for dispatch.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          <Grid size={{ xs: 12 }}>
            <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
          </Grid>
        ) : shipments.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ py: 4, textAlign: 'center', color: '#8A7F75' }}>No shipments found.</Typography>
          </Grid>
        ) : shipments.map(shipment => {
          const isWarehouseApproved = isAtLeast(shipment.status, 'WAREHOUSE_APPROVED');
          const isLogisticsSelected = isAtLeast(shipment.status, 'LOGISTICS_SELECTED');
          const isDriverAssigned = isAtLeast(shipment.status, 'DRIVER_ASSIGNED') || !!shipment.assigned_driver;
          const isLoadingComplete = isAtLeast(shipment.status, 'LOADING_IN_PROGRESS');

          let completedCount = 1; // Lots Verified is always done
          if (isWarehouseApproved) completedCount++;
          if (isLogisticsSelected) completedCount++;
          if (isDriverAssigned) completedCount++;
          if (isLoadingComplete) completedCount++;

          const score = (completedCount / 5) * 100;
          const isReady = score === 100 && isAtLeast(shipment.status, 'LOADING_IN_PROGRESS');
          
          const tasks = [
            { name: 'Lots Verified', status: 'DONE' },
            { name: 'Warehouse Approved', status: isWarehouseApproved ? 'DONE' : 'PENDING' },
            { name: 'Logistics Partner Selected', status: isLogisticsSelected ? 'DONE' : 'PENDING' },
            { name: 'Driver Assigned', status: isDriverAssigned ? 'DONE' : 'PENDING' },
            { name: 'Loading Checklist Completed', status: isLoadingComplete ? 'DONE' : 'PENDING' },
          ];

          return (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={shipment.id}>
              <Card sx={{ 
                height: '100%', display: 'flex', flexDirection: 'column',
                borderTop: `6px solid ${isReady ? '#22C55E' : (score > 50 ? '#F59E0B' : '#EF4444')}`
              }}>
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#332922' }}>{shipment.shipment_number || `SH-${shipment.id}`}</Typography>
                    <Chip 
                      label={`${score}% Ready`} 
                      size="small" 
                      sx={{ 
                        fontWeight: 700, borderRadius: '6px',
                        bgcolor: isReady ? '#F0FDF4' : '#FFF7ED', 
                        color: isReady ? '#16A34A' : '#EA580C' 
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={score} 
                      sx={{ 
                        height: 8, borderRadius: 4,
                        bgcolor: 'rgba(0,0,0,0.05)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: isReady ? '#22C55E' : (score > 50 ? '#F59E0B' : '#EF4444')
                        }
                      }} 
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: '#8A7F75' }}>Readiness Checklist</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3, flex: 1 }}>
                    {tasks.map((task, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {task.status === 'DONE' ? (
                          <CheckCircle sx={{ color: '#22C55E', fontSize: 20 }} />
                        ) : (
                          <WarningAmber sx={{ color: '#F59E0B', fontSize: 20 }} />
                        )}
                        <Typography sx={{ 
                          fontSize: '0.85rem', fontWeight: 600, 
                          color: task.status === 'DONE' ? '#8A7F75' : '#332922',
                          textDecoration: task.status === 'DONE' ? 'line-through' : 'none'
                        }}>
                          {task.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ mb: 2 }} />
                  
                  <Button 
                    variant={isReady ? "contained" : "outlined"} 
                    color={isReady ? "success" : "primary"}
                    fullWidth 
                    startIcon={isReady ? (dispatchingId === shipment.id ? <CircularProgress size={20} color="inherit" /> : <AssignmentTurnedIn />) : <ArrowForward />}
                    disabled={(!isReady && isLoadingComplete) || dispatchingId === shipment.id || isAtLeast(shipment.status, 'READY_FOR_TRANSIT')}
                    onClick={() => isReady ? handleDispatch(shipment.id) : navigate(`/loading-checklist/${shipment.id}`)}
                  >
                    {isAtLeast(shipment.status, 'READY_FOR_TRANSIT') ? "Dispatched" : (isReady ? "Ready for Dispatch" : "Complete Pending Tasks")}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
