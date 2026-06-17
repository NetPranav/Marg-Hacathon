import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useSlottingStore } from '@/stores/slottingStore';
import { slottingApi } from '@/api/endpoints';
import WarehouseCanvas from '@/components/slotting/WarehouseCanvas';
import InventorySidebar from '@/components/slotting/InventorySidebar';
import WarehouseEditor from '@/components/slotting/WarehouseEditor';
import SlottingHUD from '@/components/slotting/SlottingHUD';

export default function SlottingPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { lotId } = useParams();
  
  const { setLayout, setParcels, viewMode } = useSlottingStore();

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        // Load layout and parcels in parallel
        const [layoutRes, parcelsRes] = await Promise.all([
          slottingApi.getLayout(),
          slottingApi.listParcels()
        ]);
        
        if (mounted) {
          setLayout(layoutRes.data);
          const allParcels = parcelsRes.data.results || parcelsRes.data;
          setParcels(allParcels);
          
          if (lotId) {
            const lotParcelIds = allParcels
              .filter((p: any) => String(p.parcel_id).startsWith(`${lotId}-`))
              .map((p: any) => p.id);
            useSlottingStore.setState({ selectedParcelIds: lotParcelIds });
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to load slotting data:', err);
          setError('Failed to load warehouse data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [setLayout, setParcels]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="h6" color="text.secondary">Loading Smart Warehouse...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', bgcolor: '#0F172A' }}>
      {/* Left Sidebar (Inventory) */}
      {viewMode === 'inventory' && <InventorySidebar />}

      {/* Main 3D Canvas Area */}
      <Box sx={{ flex: 1, position: 'relative', bgcolor: '#0F172A' }}>
        <SlottingHUD />
        <WarehouseCanvas />
      </Box>

      {/* Right Sidebar (Editor) */}
      {viewMode === 'editor' && <WarehouseEditor />}
    </Box>
  );
}
