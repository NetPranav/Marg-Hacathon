import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TextField, MenuItem, Typography, InputAdornment, alpha, IconButton, Tooltip,
} from '@mui/material';
import { Search, Visibility, FilterList, LocalShipping } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { shipmentsApi } from '@/api/endpoints';

const ORANGE = '#E8700A';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DISPATCHED: { label: 'Dispatched', color: '#4F46E5' },
  IN_TRANSIT: { label: 'In Transit', color: '#F97316' },
  ARRIVED_AT_GATE: { label: 'Arrived at Gate', color: '#22C55E' },
  APPROACHING_DESTINATION: { label: 'Approaching', color: '#F59E0B' },
  SLOTTING_IN_PROGRESS: { label: 'Slotting', color: '#3B82F6' },
  RECEIVING_IN_PROGRESS: { label: 'Receiving', color: '#8B5CF6' },
};

const INCOMING_STATUSES = 'READY_FOR_TRANSIT,IN_TRANSIT,APPROACHING_DESTINATION,ARRIVED_AT_GATE,RECEIVING_IN_PROGRESS,SLOTTING_IN_PROGRESS';

export default function IncomingShipmentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['incoming-all', statusFilter],
    queryFn: () => shipmentsApi.list({
      status__in: statusFilter || INCOMING_STATUSES,
      page_size: 50,
    }),
    refetchInterval: 15000,
  });

  const shipments = (data?.data?.results ?? []).filter((s: any) =>
    !search || s.shipment_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.factory_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Incoming Shipments
        </Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          Track and manage all inbound shipments to your warehouse
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{
        p: 2, mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center',
        border: `1px solid ${alpha(ORANGE, 0.06)}`,
      }}>
        <TextField
          size="small" placeholder="Search shipments..." value={search}
          onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#CBD5E1', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          label="Status" sx={{ minWidth: 180 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FilterList sx={{ color: '#CBD5E1', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
        >
          <MenuItem value="">All Incoming</MenuItem>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <MenuItem key={k} value={k}>{v.label}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping sx={{ fontSize: 18, color: '#CBD5E1' }} />
          <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600 }}>
            {shipments.length} shipment{shipments.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Shipment #</TableCell>
                <TableCell>Factory</TableCell>
                <TableCell>Truck</TableCell>
                <TableCell>Driver</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, color: '#94A3B8' }}>
                    Loading shipments...
                  </TableCell>
                </TableRow>
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, color: '#94A3B8' }}>
                    No incoming shipments found
                  </TableCell>
                </TableRow>
              ) : shipments.map((s: any, i: number) => {
                const st = STATUS_MAP[s.status] ?? { label: s.status, color: '#6B7280' };
                return (
                  <TableRow
                    key={s.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both`,
                      transition: 'background-color 0.2s ease',
                      '&:hover': { bgcolor: alpha(ORANGE, 0.02) },
                    }}
                    onClick={() => navigate(`/shipments/${s.id}`)}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.85rem', color: '#0F172A' }}>
                        {s.shipment_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {s.factory_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {s.truck_registration || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {s.driver_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.priority} size="small"
                        sx={{
                          bgcolor: s.priority === 'HIGH' || s.priority === 'CRITICAL'
                            ? alpha('#EF4444', 0.08) : alpha('#3B82F6', 0.08),
                          color: s.priority === 'HIGH' || s.priority === 'CRITICAL'
                            ? '#EF4444' : '#3B82F6',
                          fontWeight: 600, fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={st.label} size="small"
                        sx={{ bgcolor: alpha(st.color, 0.08), color: st.color, fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); navigate(`/shipments/${s.id}`); }}
                          sx={{
                            color: '#CBD5E1',
                            '&:hover': { color: ORANGE, bgcolor: alpha(ORANGE, 0.06) },
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
