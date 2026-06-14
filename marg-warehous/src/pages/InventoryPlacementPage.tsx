import { Box, Typography, Card, CardContent, Grid, Button, alpha, Chip } from '@mui/material';
import { Place, LocalShipping, Inventory2, Straighten, CheckCircle, SwapHoriz } from '@mui/icons-material';

const ORANGE = '#E8700A';

const MOCK_PLACEMENTS: any[] = [];

export default function InventoryPlacementPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Inventory Placement
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Confirm execution of AI slotting recommendations and physically place parcels.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {MOCK_PLACEMENTS.map((item) => (
          <Grid item xs={12} md={6} lg={4} key={item.parcelId}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
              opacity: item.status === 'COMPLETED' ? 0.7 : 1 
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 40, height: 40, borderRadius: '10px', 
                      bgcolor: alpha(ORANGE, 0.1), color: ORANGE,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Inventory2 />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{item.parcelId}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>Dest: {item.destination}</Typography>
                    </Box>
                  </Box>
                  {item.status === 'COMPLETED' ? (
                    <Chip size="small" icon={<CheckCircle fontSize="small" />} label="Placed" sx={{ bgcolor: alpha('#22C55E', 0.1), color: '#22C55E', fontWeight: 700 }} />
                  ) : (
                    <Chip size="small" label="Pending" sx={{ bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B', fontWeight: 700 }} />
                  )}
                </Box>

                <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, mb: 2, border: '1px solid #E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    Recommended Slot
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: '#0F172A', fontWeight: 600 }}>Rack {item.recRack}</Typography>
                    <Typography sx={{ color: '#0F172A', fontWeight: 600 }}>{item.recShelf}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B' }}>
                    <Straighten fontSize="small" />
                    <Typography variant="body2">{item.distance} from nearest gate</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <LocalShipping sx={{ color: '#3B82F6', fontSize: 18 }} />
                  <Typography variant="caption" sx={{ color: '#3B82F6', fontWeight: 600 }}>{item.grouping}</Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    disabled={item.status === 'COMPLETED'}
                    startIcon={<CheckCircle />}
                    sx={{ flex: 1, bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' }, fontWeight: 700, textTransform: 'none' }}
                  >
                    Accept & Place
                  </Button>
                  <Button 
                    variant="outlined"
                    disabled={item.status === 'COMPLETED'} 
                    startIcon={<SwapHoriz />}
                    sx={{ flex: 1, color: '#0F172A', borderColor: '#CBD5E1', fontWeight: 700, textTransform: 'none' }}
                  >
                    Modify
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
