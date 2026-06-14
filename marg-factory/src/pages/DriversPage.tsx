import React from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Avatar,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fleetApi } from '@/api/endpoints';

export default function DriversPage() {
  const { data } = useQuery({
    queryKey: ['drivers-all'],
    queryFn: () => fleetApi.listDrivers(),
  });
  const drivers = data?.data?.results ?? [];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Fleet — Drivers</Typography>
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Driver</TableCell>
                <TableCell>License Number</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Availability</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drivers.map((d: any) => (
                <TableRow key={d.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#F97316', fontSize: '0.8rem' }}>
                        {d.user_full_name?.charAt(0) || 'D'}
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{d.user_full_name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{d.license_number}</TableCell>
                  <TableCell>{d.emergency_contact || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={d.is_available ? 'Available' : 'On Trip'}
                      size="small"
                      sx={{
                        bgcolor: d.is_available ? '#D1FAE5' : '#FEF3C7',
                        color: d.is_available ? '#059669' : '#D97706',
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
