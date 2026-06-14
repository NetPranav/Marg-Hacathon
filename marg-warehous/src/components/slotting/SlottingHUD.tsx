import { Box, Typography, ToggleButtonGroup, ToggleButton, Paper, Grid, Button } from '@mui/material';
import { ViewInAr, Edit, FormatListBulleted } from '@mui/icons-material';
import { useSlottingStore } from '@/stores/slottingStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditParcelDialog from './EditParcelDialog';

export default function SlottingHUD() {
  const { viewMode, setViewMode, layout, selectedParcel, clearSelection } = useSlottingStore();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const navigate = useNavigate();

  if (!layout) return null;
  const util = layout.utilization;

  return (
    <>
      {/* Back Button */}
      <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
        <Button variant="contained" color="secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>

      {/* Top Bar: View Mode Toggles */}
      <Box sx={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, display: 'flex', gap: 2, alignItems: 'center'
      }}>
        <Paper elevation={4} sx={{ borderRadius: '12px', p: 0.5, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
          >
            <ToggleButton value="visualization" sx={{ px: 2, py: 1, borderRadius: '8px !important', '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } } }}>
              <ViewInAr fontSize="small" sx={{ mr: 1 }} /> 3D View
            </ToggleButton>
            <ToggleButton value="editor" sx={{ px: 2, py: 1, borderRadius: '8px !important', '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } } }}>
              <Edit fontSize="small" sx={{ mr: 1 }} /> Layout Editor
            </ToggleButton>
            <ToggleButton value="inventory" sx={{ px: 2, py: 1, borderRadius: '8px !important', '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } } }}>
              <FormatListBulleted fontSize="small" sx={{ mr: 1 }} /> Inventory
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
      </Box>

      {/* Bottom Bar: KPI Metrics */}
      <Box sx={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        zIndex: 10, width: '90%', maxWidth: 800
      }}>
        <Paper elevation={4} sx={{ 
          borderRadius: '16px', p: 2, 
          bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
          border: '1px solid', borderColor: 'divider'
        }}>
          <Grid container spacing={2} textAlign="center">
            <Grid item xs>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Space Utilization</Typography>
              <Typography variant="h5" fontWeight={700} color={util.utilization_pct > 85 ? 'error.main' : 'primary.main'}>
                {util.utilization_pct}%
              </Typography>
            </Grid>
            <Grid item xs>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Total Volume</Typography>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {util.occupied_volume.toLocaleString()} <Typography component="span" variant="body2">/ {util.total_volume.toLocaleString()} m³</Typography>
              </Typography>
            </Grid>
            <Grid item xs>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Stored Parcels</Typography>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {util.parcel_count}
              </Typography>
            </Grid>
            <Grid item xs>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>Racks / Shelves</Typography>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {util.rack_count} / {util.shelf_count}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Selected Parcel Overlay */}
      {selectedParcel && (
        <Paper elevation={6} sx={{
          position: 'absolute', top: 80, right: 20, zIndex: 10,
          width: 300, p: 2, borderRadius: '12px'
        }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Parcel {selectedParcel.parcel_id}</Typography>
          <Typography variant="body2" color="text.secondary">Current Shelf: {selectedParcel.shelf}</Typography>
          <Typography variant="body2" color="text.secondary">Dims: {selectedParcel.width.toFixed(2)}x{selectedParcel.height.toFixed(2)}x{selectedParcel.depth.toFixed(2)} m</Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button size="small" variant="contained" onClick={() => setEditDialogOpen(true)}>Edit Parcel</Button>
            <Button size="small" variant="outlined" onClick={clearSelection}>Close</Button>
          </Box>
        </Paper>
      )}

      {selectedParcel && (
        <EditParcelDialog 
          open={editDialogOpen} 
          onClose={() => setEditDialogOpen(false)} 
          parcel={selectedParcel} 
        />
      )}
    </>
  );
}
