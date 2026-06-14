import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { slottingApi } from '@/api/endpoints';
import { useSlottingStore } from '@/stores/slottingStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function WarehouseSetupWizard({ open, onClose }: Props) {
  const { setLayout } = useSlottingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [config, setConfig] = useState({
    width: 50,
    depth: 30,
    height: 6,
    rows: 4,
    columns: 6,
    shelves_per_rack: 4
  });

  const handleChange = (field: string, value: string) => {
    setConfig(prev => ({ ...prev, [field]: Number(value) }));
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Call the backend init endpoint to generate models
      await slottingApi.initLayout(config);
      
      // Reload layout from backend
      const res = await slottingApi.getLayout();
      setLayout(res.data);
      
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to generate warehouse layout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>Warehouse Setup Wizard</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Configure the initial dimensions and structure of your warehouse. 
        </Typography>

        <Alert severity="warning" sx={{ mb: 3 }}>
          Running this wizard will wipe the existing racks and parcels to generate a fresh grid structure. 
          To expand without wiping, use the "Layout Editor" and "Bulk Add" tools instead.
        </Alert>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Building Dimensions (Meters)</Typography>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="Width (X)" type="number" value={config.width} onChange={e => handleChange('width', e.target.value)} />
              <TextField fullWidth label="Depth (Z)" type="number" value={config.depth} onChange={e => handleChange('depth', e.target.value)} />
              <TextField fullWidth label="Height (Y)" type="number" value={config.height} onChange={e => handleChange('height', e.target.value)} />
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Rack Grid Configuration</Typography>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="Rows" type="number" value={config.rows} onChange={e => handleChange('rows', e.target.value)} />
              <TextField fullWidth label="Columns" type="number" value={config.columns} onChange={e => handleChange('columns', e.target.value)} />
              <TextField fullWidth label="Shelves per Rack" type="number" value={config.shelves_per_rack} onChange={e => handleChange('shelves_per_rack', e.target.value)} />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
        <Button onClick={handleGenerate} variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : null}>
          {loading ? 'Generating...' : 'Generate Layout'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

