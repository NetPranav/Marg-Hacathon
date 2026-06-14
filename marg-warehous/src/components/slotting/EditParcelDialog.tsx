import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  TextField,
  Stack,
  Typography,
  Box
} from '@mui/material';
import { slottingApi } from '@/api/endpoints';
import { useSlottingStore } from '@/stores/slottingStore';

interface Props {
  open: boolean;
  onClose: () => void;
  parcel: any;
}

export default function EditParcelDialog({ open, onClose, parcel }: Props) {
  const { layout, setLayout, setParcels, selectParcel } = useSlottingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedRack, setSelectedRack] = useState<string>('');
  const [selectedShelf, setSelectedShelf] = useState<number | ''>('');
  
  const [width, setWidth] = useState<number>(1.0);
  const [height, setHeight] = useState<number>(1.0);
  const [depth, setDepth] = useState<number>(1.0);
  const [color, setColor] = useState<string>('#C28E5F');

  useEffect(() => {
    if (parcel) {
      setSelectedRack(parcel.rack_id || '');
      setSelectedShelf(parcel.shelf || '');
      setWidth(parcel.width || 1.0);
      setHeight(parcel.height || 1.0);
      setDepth(parcel.depth || 1.0);
      setColor(parcel.color || '#C28E5F');
    }
  }, [parcel]);

  const handleSave = async () => {
    if (!selectedShelf) return;
    try {
      setLoading(true);
      setError('');
      
      // Update backend
      await slottingApi.updateParcel(parcel.id, { 
        shelf: selectedShelf,
        width,
        height,
        depth,
        color
      });
      
      // Reload store data
      const [layoutRes, parcelsRes] = await Promise.all([
        slottingApi.getLayout(),
        slottingApi.listParcels()
      ]);
      
      setLayout(layoutRes.data);
      setParcels(parcelsRes.data.results || parcelsRes.data);
      
      // Update the selected parcel with the new data
      selectParcel({ 
        ...parcel, 
        shelf: selectedShelf, 
        rack_id: selectedRack,
        width, height, depth, color
      });
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update parcel');
    } finally {
      setLoading(false);
    }
  };

  // Get shelves for the selected rack
  const rackObj = layout?.racks.find(r => r.rack_id === selectedRack);
  const availableShelves = rackObj ? rackObj.shelves : [];

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="xs" fullWidth>
      <DialogTitle>Edit Parcel {parcel.parcel_id}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Typography variant="subtitle2" color="primary" fontWeight={700} mb={1}>Location</Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Target Rack</InputLabel>
          <Select
            value={selectedRack}
            label="Target Rack"
            onChange={(e) => {
              setSelectedRack(e.target.value as string);
              setSelectedShelf('');
            }}
          >
            {layout?.racks.map(r => (
              <MenuItem key={r.id} value={r.rack_id}>{r.rack_id}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small" disabled={!selectedRack} sx={{ mb: 3 }}>
          <InputLabel>Target Shelf</InputLabel>
          <Select
            value={selectedShelf}
            label="Target Shelf"
            onChange={(e) => setSelectedShelf(e.target.value as number)}
          >
            {availableShelves.map(s => (
              <MenuItem key={s.id} value={s.id}>
                Level {s.level} (Util: {(s.utilization * 100).toFixed(0)}%)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" color="primary" fontWeight={700} mb={1}>Dimensions & Appearance</Typography>
        <Stack direction="row" spacing={1} mb={2}>
          <TextField label="W" type="number" size="small" value={width} onChange={e => setWidth(Number(e.target.value))} />
          <TextField label="H" type="number" size="small" value={height} onChange={e => setHeight(Number(e.target.value))} />
          <TextField label="D" type="number" size="small" value={depth} onChange={e => setDepth(Number(e.target.value))} />
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">Color:</Typography>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ border: 'none', width: 40, height: 30, padding: 0, cursor: 'pointer' }} />
        </Stack>
        
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading || !selectedShelf}
        >
          {loading ? <CircularProgress size={20} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
