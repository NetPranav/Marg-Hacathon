import { Box, Typography, Card, CardContent, Grid, Chip, Button, Divider, alpha, LinearProgress } from '@mui/material';
import { FactCheck, WarningAmber, LocalShipping, Scale, Inventory2, ReportProblem } from '@mui/icons-material';

const ORANGE = '#E8700A';

const MOCK_REQUESTS: any[] = [];

export default function WarehouseApprovalsPage() {
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
        {MOCK_REQUESTS.map((req) => (
          <Grid item xs={12} md={6} key={req.id}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>{req.factory}</Typography>
                    <Typography variant="body2" sx={{ color: '#64748B', fontFamily: 'monospace' }}>Request: {req.id} • Ref: {req.shipmentId}</Typography>
                  </Box>
                  <Chip 
                    label="Pending Review" 
                    size="small" 
                    sx={{ bgcolor: alpha(ORANGE, 0.1), color: ORANGE, fontWeight: 700 }}
                  />
                </Box>

                <Box sx={{ p: 2, bgcolor: alpha('#F1F5F9', 0.5), borderRadius: 2, mb: 3 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Requested ETA</Typography>
                  <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{req.requestedEta}</Typography>
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5 }}>Expected Workload</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Inventory2 sx={{ color: '#94A3B8', fontSize: 18 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1 }}>Parcels</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.workload.parcels}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalShipping sx={{ color: '#94A3B8', fontSize: 18 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1 }}>Volume</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.workload.volume}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Scale sx={{ color: '#94A3B8', fontSize: 18 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1 }}>Weight</Typography>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.workload.weight}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {req.specialHandling.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1 }}>Special Handling</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {req.specialHandling.map(sh => (
                        <Chip key={sh} label={sh} size="small" icon={<WarningAmber fontSize="small"/>} sx={{ bgcolor: alpha('#EF4444', 0.1), color: '#EF4444', fontWeight: 600 }} />
                      ))}
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5 }}>Capacity Impact Assessment</Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>Projected Warehouse Utilization</Typography>
                    <Typography variant="caption" sx={{ color: req.impact.capacityAfter > 90 ? '#EF4444' : '#0F172A', fontWeight: 700 }}>{req.impact.capacityAfter}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={req.impact.capacityAfter} 
                    sx={{ 
                      height: 6, borderRadius: 3,
                      bgcolor: alpha('#94A3B8', 0.2),
                      '& .MuiLinearProgress-bar': { bgcolor: req.impact.capacityAfter > 90 ? '#EF4444' : ORANGE }
                    }} 
                  />
                </Box>
                
                {req.impact.dockConflict && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: alpha('#F59E0B', 0.1), borderRadius: 2 }}>
                    <ReportProblem sx={{ color: '#F59E0B', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#B45309', fontWeight: 600 }}>Dock conflict detected at requested ETA</Typography>
                  </Box>
                )}

              </CardContent>
              <CardContent sx={{ bgcolor: '#F8FAFC', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, fontWeight: 700, textTransform: 'none', flex: 1, minWidth: '120px' }}>
                  Approve
                </Button>
                <Button variant="outlined" sx={{ color: '#0F172A', borderColor: '#CBD5E1', fontWeight: 700, textTransform: 'none', flex: 1, minWidth: '160px' }}>
                  Approve w/ Conditions
                </Button>
                <Button variant="outlined" sx={{ color: '#F59E0B', borderColor: alpha('#F59E0B', 0.5), fontWeight: 700, textTransform: 'none', flex: 1, minWidth: '120px' }}>
                  Request Delay
                </Button>
                <Button variant="outlined" sx={{ color: '#EF4444', borderColor: alpha('#EF4444', 0.5), fontWeight: 700, textTransform: 'none', flex: 1, minWidth: '100px' }}>
                  Reject
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
