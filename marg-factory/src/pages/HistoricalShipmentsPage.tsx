import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  TextField, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, InputAdornment, MenuItem,
} from '@mui/material';
import {
  History, Search, FilterList, Visibility,
  CalendarMonth,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { shipmentsApi } from '../api/endpoints';

export default function HistoricalShipmentsPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params: Record<string, unknown> = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      const res = await shipmentsApi.list(params);
      setShipments(res.data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
          Historical Shipments
        </Typography>
        <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
          Search and analyze past shipment records.
        </Typography>
      </Box>

      {/* Search Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Shipment # or Lot #"
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: '#B0A89E' }} /></InputAdornment>
            }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="CREATED">Created</MenuItem>
            <MenuItem value="READY_FOR_TRANSIT">Ready For Transit</MenuItem>
            <MenuItem value="IN_TRANSIT">In Transit</MenuItem>
            <MenuItem value="DELIVERED">Delivered</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>
          <TextField
            type="date"
            size="small"
            label="From"
            value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <TextField
            type="date"
            size="small"
            label="To"
            value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <Button
            variant="contained"
            startIcon={<FilterList />}
            onClick={handleSearch}
            sx={{ borderRadius: '10px' }}
          >
            Search
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
      ) : !searched ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <History sx={{ fontSize: 60, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#8A7F75' }}>Search Historical Records</Typography>
            <Typography variant="body2" sx={{ color: '#B0A89E' }}>
              Use the filters above to search for past shipments.
            </Typography>
          </CardContent>
        </Card>
      ) : shipments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" sx={{ color: '#8A7F75' }}>No Results Found</Typography>
            <Typography variant="body2" sx={{ color: '#B0A89E' }}>Try adjusting your search criteria.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Shipment #</TableCell>
                  <TableCell>Route</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipments.map(s => (
                  <TableRow key={s.id} hover sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/shipments/${s.id}`)}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#332922', fontSize: '0.9rem' }}>
                        {s.shipment_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {s.factory_name} → {s.warehouse_name}
                    </TableCell>
                    <TableCell>
                      <Chip label={s.status?.replace('_', ' ') || 'N/A'} size="small"
                        sx={{ fontWeight: 700, borderRadius: '8px' }} />
                    </TableCell>
                    <TableCell>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<Visibility />}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
}
