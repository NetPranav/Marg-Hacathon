import { Box, Typography, TextField, InputAdornment, List, ListItem, ListItemButton, ListItemText, Chip, Button, IconButton, Divider } from '@mui/material';
import { Search, Add, LocationOn, FilterList } from '@mui/icons-material';
import { useSlottingStore, ParcelData } from '@/stores/slottingStore';
import { useState, useMemo } from 'react';
import AddParcelDialog from './AddParcelDialog';

export default function InventorySidebar() {
  const { parcels, searchQuery, setSearchQuery, locateParcel, selectedParcel } = useSlottingStore();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filteredParcels = useMemo(() => {
    let list = parcels;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.parcel_id || '').toLowerCase().includes(q) || 
        (p.destination || '').toLowerCase().includes(q) ||
        (p.rack_id && p.rack_id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [parcels, searchQuery]);

  return (
    <>
      <Box sx={{
        width: 320,
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        position: 'relative'
      }}>
        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Inventory
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
            size="small"
            sx={{ borderRadius: '8px' }}
          >
            Add Parcel
          </Button>
        </Box>

        <Divider />

        {/* Search */}
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search ID, Dest, Rack..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small"><FilterList fontSize="small" /></IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: '10px', bgcolor: '#F8FAFC' }
            }}
          />
        </Box>

        <Divider />

        {/* Parcel List */}
        <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
          {filteredParcels.map((parcel) => (
            <ListItem key={parcel.id} disablePadding>
              <ListItemButton
                onClick={() => locateParcel(parcel)}
                selected={selectedParcel?.id === parcel.id}
                sx={{ 
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(232, 112, 10, 0.08)',
                    borderLeft: '4px solid #E8700A',
                  }
                }}
              >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {parcel.parcel_id}
                    </Typography>
                    <Chip 
                      label={parcel.status} 
                      size="small" 
                      color={parcel.status === 'STORED' ? 'success' : 'warning'}
                      sx={{ height: 20, fontSize: '0.65rem' }} 
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="inherit" />
                      {parcel.destination}
                    </Typography>
                    {parcel.rack_id && (
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, mt: 0.5, display: 'block' }}>
                        Pos: {parcel.rack_id} - L{parcel.shelf_level} - {parcel.position_label}
                      </Typography>
                    )}
                  </Box>
                }
              />
              </ListItemButton>
            </ListItem>
          ))}
          {filteredParcels.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">No parcels found.</Typography>
            </Box>
          )}
        </List>
      </Box>

      {addDialogOpen && (
        <AddParcelDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
      )}
    </>
  );
}
