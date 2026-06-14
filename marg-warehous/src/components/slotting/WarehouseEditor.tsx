import { Box, Typography, TextField, Button, Divider, Alert, Stack } from '@mui/material';
import { Save } from '@mui/icons-material';
import { useSlottingStore } from '@/stores/slottingStore';
import { useState, useEffect } from 'react';
import { slottingApi, docksApi } from '@/api/endpoints';
import WarehouseSetupWizard from './WarehouseSetupWizard';

export default function WarehouseEditor() {
  const { layout, setLayout, selectedRackId, setViewMode, parcels, setParcels } = useSlottingStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [dims, setDims] = useState({ width: 40, depth: 30, height: 6 });
  const [gates, setGates] = useState<any[]>([]);
  const [rackCfg, setRackCfg] = useState<any>(null);
  
  const [wizardOpen, setWizardOpen] = useState(false);
  const [bulkRack, setBulkRack] = useState({ count: 1, width: 2.5, depth: 1.2, height: 1.5, shelves: 4 });
  const [bulkRemoveRackCount, setBulkRemoveRackCount] = useState(1);
  const [bulkParcel, setBulkParcel] = useState({ count: 10, width: 1.0, height: 1.0, depth: 1.0, color: '#C28E5F' });
  const [bulkRemoveParcelCount, setBulkRemoveParcelCount] = useState(1);

  useEffect(() => {
    if (layout) {
      setDims({ width: layout.width, depth: layout.depth, height: layout.height });
      setGates(JSON.parse(JSON.stringify(layout.dock_bays)));
      
      if (selectedRackId) {
        const r = layout.racks.find(rack => rack.rack_id === selectedRackId);
        if (r) setRackCfg(JSON.parse(JSON.stringify(r)));
      } else {
        setRackCfg(null);
      }
    }
  }, [layout, selectedRackId]);

  const handleSaveAll = async () => {
    if (!layout) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Save warehouse dimensions
      await slottingApi.updateLayout({ id: layout.id, ...dims });

      // Save Gate positions
      await Promise.all(gates.map(gate => 
        docksApi.update(gate.id, { x_position: gate.x_position, z_position: gate.z_position })
      ));

      // Save all Racks (positions and selected rack dims)
      await Promise.all(layout.racks.map(rack => {
        const isSelected = rackCfg && rack.rack_id === rackCfg.rack_id;
        return slottingApi.updateRack(rack.id, {
          x_position: rack.x_position,
          z_position: rack.z_position,
          ...(isSelected ? {
            num_shelves: rackCfg.num_shelves,
            shelf_width: rackCfg.shelf_width,
            shelf_height: rackCfg.shelf_height,
            shelf_depth: rackCfg.shelf_depth,
          } : {})
        });
      }));

      // Reload layout
      const res = await slottingApi.getLayout();
      setLayout(res.data);
      setSuccess('All changes saved successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const updateGate = (index: number, field: string, val: string) => {
    const newGates = [...gates];
    newGates[index][field] = Number(val);
    setGates(newGates);
  };

  const handleBulkAddRacks = async () => {
    if (!layout) return;
    if (bulkRack.height > layout.height) {
      setError("Rack height cannot exceed warehouse height");
      return;
    }
    try {
      setLoading(true);
      setError('');
      const existingRacks = layout.racks.length;
      for (let i = 0; i < bulkRack.count; i++) {
        const idx = existingRacks + i;
        const col = idx % 8;
        const row = Math.floor(idx / 8);
        
        // Arrange automatically
        const startX = -layout.width / 2 + bulkRack.width / 2 + 3;
        const startZ = -layout.depth / 2 + bulkRack.depth / 2 + 3;
        
        const px = startX + col * (bulkRack.width + 1.5);
        const pz = startZ + row * (bulkRack.depth + 1.5);

        const rackRes = await slottingApi.createRack({
          warehouse: layout.id,
          rack_id: `R-NEW-${Date.now()}-${i}`,
          x_position: px,
          z_position: pz,
          shelf_width: bulkRack.width,
          shelf_depth: bulkRack.depth,
          shelf_height: bulkRack.height,
          num_shelves: bulkRack.shelves
        });
        const rId = rackRes.data.id;
        for (let j = 0; j < bulkRack.shelves; j++) {
          await slottingApi.createShelf({ rack: rId, level: j });
        }
      }
      const res = await slottingApi.getLayout();
      setLayout(res.data);
      setSuccess(`Added ${bulkRack.count} racks successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError("Failed to add racks");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRemoveRacks = async () => {
    if (!layout || layout.racks.length === 0) {
      setError("No racks to remove");
      return;
    }
    try {
      setLoading(true);
      setError('');
      const toRemove = layout.racks.slice(0, bulkRemoveRackCount);
      for (const r of toRemove) {
        await slottingApi.deleteRack(r.id);
      }
      
      const [resLayout, resParcels] = await Promise.all([
        slottingApi.getLayout(),
        slottingApi.listParcels()
      ]);
      setLayout(resLayout.data);
      setParcels(resParcels.data.results || resParcels.data);
      
      setSuccess(`Removed ${toRemove.length} racks successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to remove racks");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAddParcels = async () => {
    if (!layout) return;
    try {
      setLoading(true);
      setError('');
      // Find all shelves
      const shelves: number[] = [];
      layout.racks.forEach((r: any) => {
        r.shelves.forEach((s: any) => shelves.push(s.id));
      });
      if (shelves.length === 0) throw new Error("No shelves available");

      for (let i = 0; i < bulkParcel.count; i++) {
        const randomShelf = shelves[Math.floor(Math.random() * shelves.length)];
        await slottingApi.createParcel({
          shelf: randomShelf,
          parcel_id: `P-NEW-${Date.now()}-${i}`,
          width: bulkParcel.width,
          height: bulkParcel.height,
          depth: bulkParcel.depth,
          color: bulkParcel.color
        });
      }
      
      const [resLayout, resParcels] = await Promise.all([
        slottingApi.getLayout(),
        slottingApi.listParcels()
      ]);
      setLayout(resLayout.data);
      setParcels(resParcels.data.results || resParcels.data);
      
      setSuccess(`Added ${bulkParcel.count} parcels successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to add parcels");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRemoveParcels = async () => {
    if (parcels.length === 0) {
      setError("No parcels to remove");
      return;
    }
    try {
      setLoading(true);
      setError('');
      const toRemove = parcels.slice(0, bulkRemoveParcelCount);
      for (const p of toRemove) {
        await slottingApi.deleteParcel(p.id);
      }
      
      const [resLayout, resParcels] = await Promise.all([
        slottingApi.getLayout(),
        slottingApi.listParcels()
      ]);
      setLayout(resLayout.data);
      setParcels(resParcels.data.results || resParcels.data);
      
      setSuccess(`Removed ${toRemove.length} parcels successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to remove parcels");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAllParcels = async () => {
    if (parcels.length === 0) {
      setError("No parcels to remove");
      return;
    }
    if (!window.confirm("Are you sure you want to delete ALL parcels?")) return;
    
    try {
      setLoading(true);
      setError('');
      for (const p of parcels) {
        await slottingApi.deleteParcel(p.id);
      }
      
      const [resLayout, resParcels] = await Promise.all([
        slottingApi.getLayout(),
        slottingApi.listParcels()
      ]);
      setLayout(resLayout.data);
      setParcels(resParcels.data.results || resParcels.data);
      
      setSuccess(`Removed all ${parcels.length} parcels successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to remove parcels");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      width: 340, height: '100%', bgcolor: 'background.paper',
      borderLeft: '1px solid', borderColor: 'divider',
      display: 'flex', flexDirection: 'column', zIndex: 10, position: 'relative'
    }}>
      <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>Layout Editor</Typography>
        <Button size="small" variant="outlined" onClick={() => setWizardOpen(true)}>Wizard</Button>
      </Box>
      <Divider />
      
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
        {error && <Alert severity="error" sx={{ py: 0 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ py: 0 }}>{success}</Alert>}

        {/* Global Dims */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1}>Building Size</Typography>
          <Stack direction="row" spacing={1}>
            <TextField label="W" type="number" size="small" value={dims.width} onChange={(e) => setDims({ ...dims, width: Number(e.target.value) })} />
            <TextField label="D" type="number" size="small" value={dims.depth} onChange={(e) => setDims({ ...dims, depth: Number(e.target.value) })} />
            <TextField label="H" type="number" size="small" value={dims.height} onChange={(e) => setDims({ ...dims, height: Number(e.target.value) })} />
          </Stack>
        </Box>

        <Divider />

        {/* Selected Rack Config */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1}>
            Rack Config {rackCfg ? `(${rackCfg.rack_id})` : '(Select a rack in 3D)'}
          </Typography>
          {rackCfg ? (
            <Stack spacing={1.5}>
              <TextField label="Number of Shelves" type="number" size="small" value={rackCfg.num_shelves} onChange={(e) => setRackCfg({ ...rackCfg, num_shelves: Number(e.target.value) })} />
              <Stack direction="row" spacing={1}>
                <TextField label="Width" type="number" size="small" value={rackCfg.shelf_width} onChange={(e) => setRackCfg({ ...rackCfg, shelf_width: Number(e.target.value) })} />
                <TextField label="Depth" type="number" size="small" value={rackCfg.shelf_depth} onChange={(e) => setRackCfg({ ...rackCfg, shelf_depth: Number(e.target.value) })} />
                <TextField label="Height" type="number" size="small" value={rackCfg.shelf_height} onChange={(e) => setRackCfg({ ...rackCfg, shelf_height: Number(e.target.value) })} />
              </Stack>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">Click on a rack in the 3D view to configure its shelves.</Typography>
          )}
        </Box>

        <Divider />

        {/* Gates */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1}>Gate Positions</Typography>
          <Stack spacing={1.5}>
            {gates.map((g, i) => (
              <Box key={g.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ width: 40, fontWeight: 700 }}>{g.dock_number}</Typography>
                <TextField label="X" type="number" size="small" sx={{ width: 80 }} value={g.x_position || 0} onChange={(e) => updateGate(i, 'x_position', e.target.value)} />
                <TextField label="Z" type="number" size="small" sx={{ width: 80 }} value={g.z_position || 0} onChange={(e) => updateGate(i, 'z_position', e.target.value)} />
              </Box>
            ))}
          </Stack>
        </Box>

        <Divider />

        {/* Bulk Add Racks */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1}>Bulk Add Racks</Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1}>
              <TextField label="Count" type="number" size="small" value={bulkRack.count} onChange={(e) => setBulkRack({ ...bulkRack, count: Number(e.target.value) })} />
              <TextField label="Shelves" type="number" size="small" value={bulkRack.shelves} onChange={(e) => setBulkRack({ ...bulkRack, shelves: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField label="Width" type="number" size="small" value={bulkRack.width} onChange={(e) => setBulkRack({ ...bulkRack, width: Number(e.target.value) })} />
              <TextField label="Depth" type="number" size="small" value={bulkRack.depth} onChange={(e) => setBulkRack({ ...bulkRack, depth: Number(e.target.value) })} />
              <TextField label="Height" type="number" size="small" value={bulkRack.height} onChange={(e) => setBulkRack({ ...bulkRack, height: Number(e.target.value) })} />
            </Stack>
            <Button variant="outlined" size="small" onClick={handleBulkAddRacks} disabled={loading}>Add Racks</Button>
          </Stack>
        </Box>

        <Divider />

        {/* Bulk Remove Racks */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="error.main" mb={1}>Bulk Remove Racks</Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1}>
              <TextField label="Count" type="number" size="small" value={bulkRemoveRackCount} onChange={(e) => setBulkRemoveRackCount(Number(e.target.value))} />
            </Stack>
            <Button variant="outlined" color="error" size="small" onClick={handleBulkRemoveRacks} disabled={loading}>Remove Racks</Button>
          </Stack>
        </Box>

        <Divider />

        {/* Bulk Add Parcels */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="primary" mb={1}>Bulk Add Parcels</Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1}>
              <TextField label="Count" type="number" size="small" value={bulkParcel.count} onChange={(e) => setBulkParcel({ ...bulkParcel, count: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField label="Width" type="number" size="small" value={bulkParcel.width} onChange={(e) => setBulkParcel({ ...bulkParcel, width: Number(e.target.value) })} />
              <TextField label="Depth" type="number" size="small" value={bulkParcel.depth} onChange={(e) => setBulkParcel({ ...bulkParcel, depth: Number(e.target.value) })} />
              <TextField label="Height" type="number" size="small" value={bulkParcel.height} onChange={(e) => setBulkParcel({ ...bulkParcel, height: Number(e.target.value) })} />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">Color:</Typography>
              <input type="color" value={bulkParcel.color} onChange={(e) => setBulkParcel({ ...bulkParcel, color: e.target.value })} style={{ border: 'none', width: 40, height: 30, padding: 0, cursor: 'pointer' }} />
            </Stack>
            <Button variant="outlined" size="small" onClick={handleBulkAddParcels} disabled={loading}>Add Parcels</Button>
          </Stack>
        </Box>

        <Divider />

        {/* Bulk Remove Parcels */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="error.main" mb={1}>Bulk Remove Parcels</Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1}>
              <TextField label="Count" type="number" size="small" value={bulkRemoveParcelCount} onChange={(e) => setBulkRemoveParcelCount(Number(e.target.value))} />
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" color="error" size="small" onClick={handleBulkRemoveParcels} disabled={loading}>Remove Count</Button>
              <Button variant="contained" color="error" size="small" onClick={handleRemoveAllParcels} disabled={loading}>Remove ALL</Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Floating Save Button over the canvas */}
      <Box sx={{
        position: 'fixed',
        bottom: 32,
        right: 370, // 340px sidebar + 30px padding
        zIndex: 1000
      }}>
        <Button 
          variant="contained" color="success" size="large" startIcon={<Save />}
          onClick={handleSaveAll} disabled={loading}
          sx={{ borderRadius: '24px', px: 4, py: 1.5, boxShadow: 6, fontWeight: 'bold' }}
        >
          {loading ? 'Saving...' : 'Save Rack Positions'}
        </Button>
      </Box>

      {/* Setup Wizard Modal */}
      <WarehouseSetupWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </Box>
  );
}
