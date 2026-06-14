import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, MenuItem,
  InputAdornment, Button, Pagination, IconButton, Tooltip,
} from '@mui/material';
import { Search, Add, Visibility, FilterList } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { shipmentsApi } from '@/api/endpoints';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/theme/statusColors';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'CREATED', label: 'Created' },
  { value: 'IN_TRANSIT', label: 'In Transit' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['shipments', { page, search, status: statusFilter }],
    queryFn: () => shipmentsApi.list({ page, search: search || undefined, status: statusFilter || undefined }),
  });

  const shipments = data?.data?.results ?? [];
  const totalPages = Math.ceil((data?.data?.count ?? 0) / 10);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Shipments</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/shipments/create')}>
          Create Shipment
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small" placeholder="Search by shipment number..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            sx={{ minWidth: 280 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9CA3AF' }} /></InputAdornment>,
            }}
          />
          <TextField
            select size="small" value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            sx={{ minWidth: 180 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><FilterList sx={{ color: '#9CA3AF' }} /></InputAdornment>,
            }}
          >
            {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </TextField>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Shipment #</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Truck</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shipments.map((s: any) => {
                const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.DRAFT;
                const pc = PRIORITY_COLORS[s.priority] ?? PRIORITY_COLORS.MEDIUM;
                return (
                  <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/shipments/${s.id}`)}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontFamily: 'monospace', color: '#18181B' }}>
                        {s.shipment_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{s.warehouse_name || '—'}</TableCell>
                    <TableCell>
                      <Chip label={s.priority} size="small" sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>{s.truck_registration || '—'}</TableCell>
                    <TableCell>{s.driver_name || '—'}</TableCell>
                    <TableCell>
                      <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" sx={{ color: '#F97316' }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {shipments.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>No shipments found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  );
}
