import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  Checkbox, Paper, CircularProgress, Divider, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Inventory2, LocalShipping, MergeType, CallSplit,
  CheckCircle, ArrowForward, Warehouse, AccessTime,
  Business
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { lotsApi, fleetApi } from '../api/endpoints';

interface DraftGroup {
  id: string;
  destination: string;
  lots: any[];
  totalWeight: number;
  totalVolume: number;
  recommendation: string;
}


export default function DraftShipmentsPage() {
  const navigate = useNavigate();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLots, setSelectedLots] = useState<Set<number>>(new Set());
  const [draftGroups, setDraftGroups] = useState<DraftGroup[]>([]);
  
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<DraftGroup | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [whLoading, setWhLoading] = useState(false);

  useEffect(() => {
    lotsApi.list()
      .then(res => setLots(res.data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleLot = (id: number) => {
    setSelectedLots(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const autoGroupByDestination = () => {
    const groups: Record<string, any[]> = {};
    lots.filter(l => selectedLots.has(l.id)).forEach(lot => {
      const dest = lot.destination_name || 'Unknown';
      if (!groups[dest]) groups[dest] = [];
      groups[dest].push(lot);
    });

    setDraftGroups(Object.entries(groups).map(([dest, lots], idx) => ({
      id: `DG-${Date.now()}-${idx}`,
      destination: dest,
      lots,
      totalWeight: lots.reduce((sum: number, l: any) =>
        sum + (l.parcels || []).reduce((ps: number, p: any) => ps + (Number(p.weight) || 0), 0), 0
      ),
      totalVolume: lots.reduce((sum: number, l: any) =>
        sum + (l.parcels || []).reduce((ps: number, p: any) =>
          ps + ((Number(p.length) || 0) * (Number(p.width) || 0) * (Number(p.height) || 0) / 1000000), 0
        ), 0
      ),
      recommendation: 'Grouped by destination',
    })));
  };

  const openWarehouseSelection = (group: DraftGroup) => {
    setSelectedGroup(group);
    setSelectedWarehouseId('');
    setWarehouseDialogOpen(true);
    setWhLoading(true);
    fleetApi.listWarehouses()
      .then(res => setWarehouses(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setWhLoading(false));
  };

  const handleCreateDraft = () => {
    if (!selectedWarehouseId) return;
    alert(`Created draft shipment for group to warehouse ${selectedWarehouseId}`);
    setWarehouseDialogOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Draft Shipments
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
            Group verified lots into shipment plans before notifying warehouses.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<MergeType />}
            onClick={autoGroupByDestination}
            disabled={selectedLots.size === 0}
            sx={{ borderRadius: '10px' }}
          >
            Auto-Group by Destination
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {/* Lot Selection Panel */}
          <Grid size={{ xs: 12, md: draftGroups.length > 0 ? 5 : 12 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
              Available Lots ({lots.length})
            </Typography>
            {lots.length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 5 }}>
                  <Inventory2 sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#8A7F75' }}>No lots available</Typography>
                  <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/lots/new')}>
                    Create Lot
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {lots.map(lot => {
                  const isSelected = selectedLots.has(lot.id);
                  return (
                    <Card
                      key={lot.id}
                      onClick={() => toggleLot(lot.id)}
                      sx={{
                        cursor: 'pointer',
                        border: isSelected ? '2px solid #F97316' : '2px solid transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Checkbox checked={isSelected} sx={{ color: '#F97316', '&.Mui-checked': { color: '#F97316' } }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#332922' }}>
                            {lot.lot_number}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#8A7F75' }}>
                            {lot.parcels?.length || 0} parcels · {lot.destination_name || 'No dest'}
                          </Typography>
                        </Box>
                        <Chip
                          label={lot.status?.replace('_', ' ') || 'DRAFT'}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: '8px', bgcolor: '#FFF7ED', color: '#EA580C' }}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Grid>

          {/* Draft Groups Panel */}
          {draftGroups.length > 0 && (
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
                Shipment Groups ({draftGroups.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {draftGroups.map(group => (
                  <Card key={group.id}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 40, height: 40, borderRadius: '10px', bgcolor: '#FFF7ED',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <LocalShipping sx={{ color: '#F97316' }} />
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: '#332922' }}>
                              → {group.destination}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#8A7F75' }}>
                              {group.recommendation}
                            </Typography>
                          </Box>
                        </Box>
                        <Button 
                          variant="contained" 
                          size="small" 
                          endIcon={<ArrowForward />} 
                          sx={{ borderRadius: '8px' }}
                          onClick={() => openWarehouseSelection(group)}
                        >
                          Create Draft
                        </Button>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid size={3}>
                          <Typography variant="caption" sx={{ color: '#8A7F75' }}>Lots</Typography>
                          <Typography sx={{ fontWeight: 700, color: '#332922' }}>{group.lots.length}</Typography>
                        </Grid>
                        <Grid size={3}>
                          <Typography variant="caption" sx={{ color: '#8A7F75' }}>Parcels</Typography>
                          <Typography sx={{ fontWeight: 700, color: '#332922' }}>
                            {group.lots.reduce((s: number, l: any) => s + (l.parcels?.length || 0), 0)}
                          </Typography>
                        </Grid>
                        <Grid size={3}>
                          <Typography variant="caption" sx={{ color: '#8A7F75' }}>Weight</Typography>
                          <Typography sx={{ fontWeight: 700, color: '#332922' }}>{group.totalWeight.toFixed(1)} kg</Typography>
                        </Grid>
                        <Grid size={3}>
                          <Typography variant="caption" sx={{ color: '#8A7F75' }}>Volume</Typography>
                          <Typography sx={{ fontWeight: 700, color: '#332922' }}>{group.totalVolume.toFixed(2)} m³</Typography>
                        </Grid>
                      </Grid>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {group.lots.map((l: any) => (
                          <Chip key={l.id} label={l.lot_number} size="small"
                            sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', fontWeight: 600, borderRadius: '6px' }} />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Warehouse Selection Dialog */}
      <Dialog 
        open={warehouseDialogOpen} 
        onClose={() => setWarehouseDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#332922', pb: 1 }}>
          Select Destination Warehouse
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#8A7F75', mb: 3 }}>
            Review capacity and operational metrics before assigning this shipment to a warehouse.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {whLoading ? (
              <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
            ) : warehouses.length === 0 ? (
              <Typography variant="body2" sx={{ py: 4, textAlign: 'center', color: '#8A7F75' }}>No warehouses found in the registry.</Typography>
            ) : warehouses.map(wh => {
              const isSelected = selectedWarehouseId === String(wh.id);
              return (
                <Card 
                  key={wh.id}
                  onClick={() => setSelectedWarehouseId(String(wh.id))}
                  sx={{ 
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #F97316' : '2px solid transparent',
                    boxShadow: isSelected ? '0 4px 20px rgba(249, 115, 22, 0.15)' : 'none',
                    bgcolor: isSelected ? '#FFF7ED' : '#FFF',
                    transition: 'all 0.2s',
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Checkbox checked={isSelected} sx={{ color: '#F97316', '&.Mui-checked': { color: '#F97316' }, p: 0 }} />
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: '#332922' }}>{wh.name}</Typography>
                          <Typography variant="caption" sx={{ color: '#8A7F75', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Business sx={{ fontSize: 14 }} /> {wh.city || 'N/A'}, {wh.state || ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip label={wh.warehouse_type?.replace(/_/g, ' ') || 'Warehouse'} size="small" sx={{ fontWeight: 700, borderRadius: '6px', bgcolor: '#EFF6FF', color: '#3B82F6' }} />
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={4}>
                        <Typography variant="caption" sx={{ color: '#8A7F75', display: 'block' }}>Capacity</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{wh.capacity || 'N/A'} m²</Typography>
                      </Grid>
                      <Grid size={4}>
                        <Typography variant="caption" sx={{ color: '#8A7F75', display: 'block' }}>Docks</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{wh.dock_count ?? 'N/A'}</Typography>
                      </Grid>
                      <Grid size={4}>
                        <Typography variant="caption" sx={{ color: '#8A7F75', display: 'block' }}>Type</Typography>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{wh.warehouse_type?.replace(/_/g, ' ') || 'Standard'}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, mt: 2 }}>
          <Button onClick={() => setWarehouseDialogOpen(false)} sx={{ color: '#8A7F75', fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateDraft} 
            disabled={!selectedWarehouseId}
            sx={{ borderRadius: '8px', px: 3, fontWeight: 700 }}
          >
            Assign & Create Draft
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
