import React from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fleetApi } from '@/api/endpoints';

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  AVAILABLE: { bg: '#D1FAE5', color: '#059669' },
  IN_TRANSIT: { bg: '#FFF7ED', color: '#F97316' },
  UNDER_MAINTENANCE: { bg: '#FEE2E2', color: '#DC2626' },
  OFFLINE: { bg: '#F3F4F6', color: '#6B7280' },
};

export default function TrucksPage() {
  const { data } = useQuery({
    queryKey: ['trucks-all'],
    queryFn: () => fleetApi.listTrucks(),
  });
  const trucks = data?.data?.results ?? [];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Fleet — Trucks</Typography>
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Registration</TableCell>
                <TableCell>Vehicle Type</TableCell>
                <TableCell>Capacity (kg)</TableCell>
                <TableCell>Assigned Driver</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trucks.map((t: any) => {
                const sm = STATUS_MAP[t.status] ?? STATUS_MAP.OFFLINE;
                return (
                  <TableRow key={t.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{t.registration_number}</TableCell>
                    <TableCell>{t.vehicle_type || '—'}</TableCell>
                    <TableCell>{t.capacity_kg}</TableCell>
                    <TableCell>{t.assigned_driver_name || '—'}</TableCell>
                    <TableCell>
                      <Chip label={t.status.replace(/_/g, ' ')} size="small" sx={{ bgcolor: sm.bg, color: sm.color, fontWeight: 600 }} />
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
