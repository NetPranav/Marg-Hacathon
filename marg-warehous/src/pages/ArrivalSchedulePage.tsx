import { useState } from 'react';
import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Menu, MenuItem, Tooltip, alpha } from '@mui/material';
import { MoreVert, CheckCircle, Schedule, ErrorOutline, InfoOutlined } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { shipmentsApi } from '@/api/endpoints';

const ORANGE = '#E8700A';

export default function ArrivalSchedulePage() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['arrival-schedule'],
    queryFn: () => shipmentsApi.list({
      status__in: 'READY_FOR_ASSIGNMENT,READY_FOR_DISPATCH,DOCK_RESERVED,DISPATCHED,IN_TRANSIT,ARRIVED_AT_WAREHOUSE',
      page_size: 50,
    }),
    refetchInterval: 15000,
  });

  const shipments = data?.data?.results || [];

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Arrival Schedule
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Coordinate incoming shipments and prepare warehouse resources in advance.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(ORANGE, 0.04) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Shipment Number</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Factory</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Expected Arrival</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Lots</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Logistics Partner</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Dock Status</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading arrival schedule...</TableCell>
                </TableRow>
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">No upcoming arrivals scheduled.</TableCell>
                </TableRow>
              ) : shipments.map((row: any) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{row.shipment_number}</TableCell>
                  <TableCell>{row.factory_name}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.eta || 'Pending'}</TableCell>
                  <TableCell>{row.lot_number || 'N/A'}</TableCell>
                  <TableCell>{row.logistics_provider_name || 'Pending'}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={row.status === 'WAITING_FOR_DOCK' ? 'Needs Dock' : (row.dock_number || 'Pending')} 
                      icon={row.dock_number ? <CheckCircle fontSize="small"/> : <Schedule fontSize="small"/>}
                      sx={{ 
                        bgcolor: row.dock_number ? alpha('#22C55E', 0.1) : alpha('#F59E0B', 0.1),
                        color: row.dock_number ? '#22C55E' : '#F59E0B',
                        fontWeight: 600
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={row.status} 
                      sx={{ 
                        bgcolor: ['ARRIVED_AT_GATE', 'RECEIVING_IN_PROGRESS'].includes(row.status) ? alpha(ORANGE, 0.1) : alpha('#94A3B8', 0.1),
                        color: ['ARRIVED_AT_GATE', 'RECEIVING_IN_PROGRESS'].includes(row.status) ? ORANGE : '#64748B',
                        fontWeight: 700
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" sx={{ mr: 1, color: '#64748B' }}>
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={(e) => handleMenuClick(e, row.id)}>
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{ '& .MuiPaper-root': { width: 220, borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' } }}
      >
        <MenuItem onClick={handleMenuClose} sx={{ fontWeight: 500, color: '#22C55E' }}>
          <CheckCircle sx={{ fontSize: 18, mr: 1.5 }} /> Approve Schedule
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ fontWeight: 500 }}>
          <Schedule sx={{ fontSize: 18, mr: 1.5, color: '#64748B' }} /> Modify Arrival Window
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ fontWeight: 500, color: '#F59E0B' }}>
          <ErrorOutline sx={{ fontSize: 18, mr: 1.5 }} /> Request Delay
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ fontWeight: 500, color: '#EF4444' }}>
          <ErrorOutline sx={{ fontSize: 18, mr: 1.5 }} /> Reject Temporarily
        </MenuItem>
      </Menu>
    </Box>
  );
}
