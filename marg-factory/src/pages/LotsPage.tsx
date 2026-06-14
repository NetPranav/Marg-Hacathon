import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Assignment as AssignmentIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { lotsApi } from '../api/endpoints';

export default function LotsPage() {
  const navigate = useNavigate();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lotsApi.list()
      .then(res => setLots(res.data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'DRAFT': return 'default';
      case 'UNDER_REVIEW': return 'warning';
      case 'SHARED': return 'info';
      case 'ACCEPTED': return 'success';
      case 'SHIPMENT_GENERATED': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Lot Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/lots/new')}
        >
          Create New Lot
        </Button>
      </Box>

      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>
        ) : lots.length === 0 ? (
          <Box p={6} textAlign="center">
            <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No Lots Found</Typography>
            <Typography variant="body2" color="text.secondary">Create a new lot to start negotiating with logistics partners.</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell>Lot Number</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell>Parcels</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Partner</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lots.map((lot) => (
                  <TableRow key={lot.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: '#332922' }}>{lot.lot_number}</TableCell>
                    <TableCell>{lot.destination_name || 'N/A'}</TableCell>
                    <TableCell>{lot.parcels?.length || 0} items</TableCell>
                    <TableCell>
                      <Chip 
                        label={lot.status.replace('_', ' ')} 
                        color={getStatusColor(lot.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{lot.assigned_logistics_name || '-'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => navigate('/logistics')}>Find Partner</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
