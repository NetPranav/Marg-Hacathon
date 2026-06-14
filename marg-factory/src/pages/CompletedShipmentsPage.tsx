import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress,
} from '@mui/material';
import {
  DoneAll, CheckCircle, Visibility, Timer,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { shipmentsApi } from '../api/endpoints';

export default function CompletedShipmentsPage() {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shipmentsApi.list({ status: 'DELIVERED' })
      .then(res => setShipments(res.data.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Completed Shipments
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
            All successfully delivered shipments.
          </Typography>
        </Box>
        <Chip
          label={`${shipments.length} Total`}
          sx={{ bgcolor: '#D1FAE5', color: '#059669', fontWeight: 700 }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
      ) : shipments.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <DoneAll sx={{ fontSize: 60, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#8A7F75' }}>No Completed Shipments</Typography>
            <Typography variant="body2" sx={{ color: '#B0A89E' }}>
              Shipments will appear here after successful delivery.
            </Typography>
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
                  <TableCell>Completion Date</TableCell>
                  <TableCell>Delivery Outcome</TableCell>
                  <TableCell align="right">Transit Duration</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipments.map(s => (
                  <TableRow key={s.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/shipments/${s.id}`)}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#332922', fontSize: '0.9rem' }}>
                        {s.shipment_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {s.factory_name} → {s.warehouse_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {s.updated_at ? new Date(s.updated_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: 16 }} />}
                        label="Delivered"
                        size="small"
                        sx={{ bgcolor: '#D1FAE5', color: '#059669', fontWeight: 700, borderRadius: '8px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Timer sx={{ fontSize: 16, color: '#8A7F75' }} />
                        <Typography variant="body2" sx={{ color: '#332922', fontWeight: 600 }}>
                          {s.eta_hours ? `${s.eta_hours}h` : 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<Visibility />} onClick={(e) => { e.stopPropagation(); navigate(`/shipments/${s.id}`); }}>
                        View
                      </Button>
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
