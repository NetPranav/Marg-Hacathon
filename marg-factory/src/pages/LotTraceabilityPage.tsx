import React, { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, TextField, 
  Button, InputAdornment, Chip, Divider,
  Stepper, Step, StepLabel, StepContent
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { 
  Search, TrackChanges, LocalShipping, Warehouse, Person, LocationOn 
} from '@mui/icons-material';

import { lotsApi } from '../api/endpoints';

export default function LotTraceabilityPage() {
  const [search, setSearch] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lotData, setLotData] = useState<any>(null);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearched(true);
    setLoading(true);
    try {
      const res = await lotsApi.list({ search: search.trim() });
      const results = res.data.results || res.data || [];
      // If we find an exact match by lot_number or just take the first result
      const match = results.find((l: any) => l.lot_number === search.trim()) || results[0];
      setLotData(match || null);
    } catch (err) {
      console.error(err);
      setLotData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Lot Traceability
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
            Track end-to-end lifecycle and current location of any lot.
          </Typography>
        </Box>
      </Box>

      {/* Search Bar */}
      <Card sx={{ mb: 4, borderRadius: '16px' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Lot Number, Parcel ID, Destination, or Shipment Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#8A7F75' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" onClick={handleSearch} sx={{ borderRadius: '8px', px: 4 }}>
            Trace
          </Button>
        </CardContent>
      </Card>

      {searched && (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                {loading ? (
                  <Typography>Loading...</Typography>
                ) : !lotData ? (
                  <Typography variant="body1" sx={{ color: '#8A7F75' }}>No results found for "{search}"</Typography>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#8A7F75', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                          Lot Details
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#332922', mt: 0.5 }}>
                          {lotData.lot_number}
                        </Typography>
                      </Box>
                      <Chip 
                        label={lotData.status?.replace('_', ' ') || 'UNKNOWN'} 
                        sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', fontWeight: 800, borderRadius: '8px' }} 
                      />
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                          <LocalShipping sx={{ color: '#F97316' }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: '#8A7F75', display: 'block' }}>Shipment</Typography>
                            <Typography sx={{ fontWeight: 700, color: '#332922' }}>N/A</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Warehouse sx={{ color: '#F97316' }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: '#8A7F75', display: 'block' }}>Destination</Typography>
                            <Typography sx={{ fontWeight: 700, color: '#332922' }}>{lotData.destination_name || 'Unknown'}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                          <Person sx={{ color: '#F97316' }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: '#8A7F75', display: 'block' }}>Driver</Typography>
                            <Typography sx={{ fontWeight: 700, color: '#332922' }}>N/A</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <TrackChanges sx={{ color: '#F97316' }} />
                          <Box>
                            <Typography variant="caption" sx={{ color: '#8A7F75', display: 'block' }}>Logistics</Typography>
                            <Typography sx={{ fontWeight: 700, color: '#332922' }}>{lotData.assigned_logistics_name || 'Pending'}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ mb: 3 }} />

                    <Box sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LocationOn sx={{ color: '#16A34A', fontSize: 32 }} />
                      <Box>
                        <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>
                          Current Live Location
                        </Typography>
                        <Typography sx={{ fontWeight: 800, color: '#14532D' }}>
                          No tracking data available
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ borderRadius: '16px', height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="subtitle2" sx={{ color: '#8A7F75', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, mb: 3 }}>
                  Lifecycle Timeline
                </Typography>
                {lotData ? (
                  <Stepper orientation="vertical" activeStep={0}>
                    <Step completed={true}>
                      <StepLabel StepIconProps={{ sx: { color: '#22C55E !important' } }}>
                        <Typography sx={{ fontWeight: 800, color: '#332922' }}>Lot Created</Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="caption" sx={{ color: '#8A7F75' }}>{new Date(lotData.created_at).toLocaleString()}</Typography>
                      </StepContent>
                    </Step>
                  </Stepper>
                ) : (
                  <Typography variant="body2" sx={{ color: '#8A7F75' }}>No timeline available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
