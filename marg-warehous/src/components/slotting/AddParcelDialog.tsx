import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, Typography, Box, CircularProgress, Alert, MenuItem, Chip } from '@mui/material';
import { useSlottingStore, Recommendation } from '@/stores/slottingStore';
import { slottingApi } from '@/api/endpoints';

export default function AddParcelDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { layout, parcels, setParcels, setLayout } = useSlottingStore();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [createdParcelId, setCreatedParcelId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Very basic uncontrolled form setup for simplicity
  const [formData, setFormData] = useState({
    height: 0.5,
    width: 0.5,
    depth: 0.5,
    weight: 20,
    color: '#C28E5F',
    destination: '',
    expected_dispatch_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    priority: 'MEDIUM',
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetRecommendation = async () => {
    if (!layout) return;
    try {
      setLoading(true);
      setError('');
      
      // 1. Create Parcel
      const parcelData = {
        parcel_id: `PKG-${Math.floor(Math.random() * 100000).toString(16).toUpperCase()}`,
        warehouse: layout.id,
        ...formData
      };
      const resParcel = await slottingApi.createParcel(parcelData);
      setCreatedParcelId(resParcel.data.parcel_id);

      // 2. Get Recommendation
      const recData = {
        warehouse: layout.id,
        ...formData
      };
      const resRec = await slottingApi.recommend(recData);
      setRecommendations(resRec.data.recommendations || []);

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to get recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (shelfId: number) => {
    if (!createdParcelId) return;
    try {
      setLoading(true);
      await slottingApi.assign({ parcel_id: createdParcelId, shelf_id: shelfId });
      
      // Refresh Data
      const [resLayout, resParcels] = await Promise.all([
        slottingApi.getLayout(layout!.id),
        slottingApi.listParcels({ warehouse: layout!.id })
      ]);
      setLayout(resLayout.data);
      setParcels(resParcels.data.results || resParcels.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign parcel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Incoming Parcel</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {!recommendations.length ? (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" fontWeight={700}>Dimensions & Weight</Typography>
            </Grid>
            <Grid item xs={4}>
              <TextField label="Height (m)" name="height" type="number" fullWidth size="small" value={formData.height} onChange={handleChange} />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Width (m)" name="width" type="number" fullWidth size="small" value={formData.width} onChange={handleChange} />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Depth (m)" name="depth" type="number" fullWidth size="small" value={formData.depth} onChange={handleChange} />
            </Grid>
            <Grid item xs={8}>
              <TextField label="Weight (kg)" name="weight" type="number" fullWidth size="small" value={formData.weight} onChange={handleChange} />
            </Grid>
            <Grid item xs={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Color:</Typography>
              <input type="color" name="color" value={formData.color} onChange={handleChange} style={{ border: 'none', width: '100%', height: 38, padding: 0, cursor: 'pointer', borderRadius: 4 }} />
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="subtitle2" color="primary" fontWeight={700}>Logistics</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Destination City" name="destination" fullWidth size="small" value={formData.destination} onChange={handleChange} required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Expected Dispatch" name="expected_dispatch_date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={formData.expected_dispatch_date} onChange={handleChange} />
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Priority" name="priority" fullWidth size="small" value={formData.priority} onChange={handleChange}>
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        ) : (
          <Box>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Recommended Positions</Typography>
            {recommendations.map((rec, i) => (
              <Box key={rec.shelf_id} sx={{ 
                p: 2, mb: 2, 
                border: '1px solid', 
                borderColor: i === 0 ? 'success.main' : 'divider',
                borderRadius: 2,
                bgcolor: i === 0 ? 'rgba(34, 197, 94, 0.04)' : 'transparent'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {i === 0 ? '⭐ Optimal: ' : ''}Rack {rec.rack_id} - Level {rec.shelf_level}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="success.main">
                    Score: {Math.round(rec.score * 100)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip size="small" label={`Space: ${Math.round(rec.breakdown.space_utilization * 100)}`} />
                  <Chip size="small" label={`Grouping: ${Math.round(rec.breakdown.destination_grouping * 100)}`} />
                  <Chip size="small" label={`Dispatch: ${Math.round(rec.breakdown.dispatch_priority * 100)}`} />
                </Box>

                {rec.warnings.map((w, wi) => (
                  <Typography key={wi} variant="caption" color="warning.main" display="block">⚠️ {w}</Typography>
                ))}

                <Button 
                  fullWidth 
                  variant={i === 0 ? "contained" : "outlined"} 
                  color={i === 0 ? "success" : "inherit"}
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() => handleAssign(rec.shelf_id)}
                  disabled={loading}
                >
                  Assign to this position
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        {!recommendations.length && (
          <Button 
            onClick={handleGetRecommendation} 
            variant="contained" 
            disabled={loading || !formData.destination}
          >
            {loading ? <CircularProgress size={24} /> : 'Get Recommendation'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
