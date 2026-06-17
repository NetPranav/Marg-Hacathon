import { Box, Typography, Card, CardContent, Grid, Chip, Button, Divider, alpha, LinearProgress } from '@mui/material';
import { FactCheck, WarningAmber, LocalShipping, Scale, Inventory2, ReportProblem } from '@mui/icons-material';

import { useEffect, useState } from 'react';
import { lotsApi } from '../api/endpoints';
import { useNavigate } from 'react-router-dom';

const ORANGE = '#E8700A';

export default function WarehouseApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRequests = () => {
    setLoading(true);
    lotsApi.list()
      .then(res => {
        const allLots = res.data.results || res.data || [];
        setRequests(allLots.filter((l: any) => l.status === 'PENDING_WAREHOUSE_APPROVAL' || l.status === 'WAREHOUSE_APPROVED'));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await lotsApi.approveWarehouse(id);
      fetchRequests();
    } catch (e) {
      console.error(e);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await lotsApi.rejectWarehouse(id);
      fetchRequests();
    } catch (e) {
      console.error(e);
      alert('Failed to reject request');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Warehouse Approvals
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Review inbound requests, assess capacity impact, and provide explicit warehouse acceptance.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12}>
            <Typography>Loading requests...</Typography>
          </Grid>
        ) : requests.length === 0 ? (
          <Grid item xs={12}>
            <Typography>No pending requests.</Typography>
          </Grid>
        ) : requests.map((req) => (
          <Grid item xs={12} md={6} key={req.id}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>{req.factory_name || 'Unknown Factory'}</Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', fontFamily: 'monospace' }}>Request: {req.id} • Ref: {req.lot_number || `LOT-${req.id}`}</Typography>
                  </Box>
                  <Chip 
                    label={req.status === 'WAREHOUSE_APPROVED' ? "Approved" : "Pending Review"} 
                    size="small" 
                    sx={{ 
                      bgcolor: req.status === 'WAREHOUSE_APPROVED' ? alpha('#22C55E', 0.1) : alpha(ORANGE, 0.1), 
                      color: req.status === 'WAREHOUSE_APPROVED' ? '#22C55E' : ORANGE, 
                      fontWeight: 700 
                    }}
                  />
                </Box>

                <Box sx={{ p: 2, bgcolor: alpha('#F1F5F9', 0.5), borderRadius: 2, mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Expected Dispatch Date</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{req.expected_dispatch_date ? new Date(req.expected_dispatch_date).toLocaleDateString() : 'Not Specified'}</Typography>
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5 }}>Expected Workload</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inventory2 sx={{ color: '#94A3B8', fontSize: 18 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1 }}>Parcels</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.parcels ? req.parcels.length : '-'}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalShipping sx={{ color: '#94A3B8', fontSize: 18 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1 }}>Volume</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>-</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Scale sx={{ color: '#94A3B8', fontSize: 18 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1 }}>Weight</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.total_weight || 0} kg</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5 }}>Capacity Impact Assessment</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Projected Warehouse Utilization</Typography>
                    <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 700 }}>~75%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    sx={{ 
                      height: 6, borderRadius: 3,
                      bgcolor: alpha('#94A3B8', 0.2),
                      '& .MuiLinearProgress-bar': { bgcolor: ORANGE }
                    }} 
                  />
                </Box>
              </CardContent>
              <CardContent sx={{ bgcolor: '#F8FAFC', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {req.status === 'PENDING_WAREHOUSE_APPROVAL' ? (
                  <>
                    <Button onClick={() => handleApprove(req.id)} variant="contained" sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, fontWeight: 700, textTransform: 'none', flex: 1, minWidth: '120px' }}>
                      Approve & Slot
                    </Button>
                    <Button onClick={() => handleReject(req.id)} variant="outlined" sx={{ color: '#EF4444', borderColor: alpha('#EF4444', 0.5), fontWeight: 700, textTransform: 'none', flex: 1, minWidth: '100px' }}>
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => navigate(`/warehouse-3d/${req.id}`)} variant="contained" sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' }, fontWeight: 700, textTransform: 'none', flex: 1, minWidth: '120px' }}>
                    View 3D Plan
                  </Button>
                )}
                <Button onClick={() => navigate(`/warehouse-approvals/${req.id}/workflow`)} variant="outlined" sx={{ fontWeight: 700, textTransform: 'none', minWidth: '120px' }}>
                  View Workflow
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
