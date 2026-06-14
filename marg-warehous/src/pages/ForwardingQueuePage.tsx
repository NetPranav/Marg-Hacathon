import { Box, Typography, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, alpha } from '@mui/material';
import { QueuePlayNext, ForwardToInbox, LocalShipping, LocationCity } from '@mui/icons-material';

const MOCK_FORWARDING: any[] = [];

const ORANGE = '#E8700A';

export default function ForwardingQueuePage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Forwarding Queue
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Manage transit inventory awaiting outbound dispatch to the next destination.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: alpha(ORANGE, 0.04) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Lot Number</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Destination City</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Next Warehouse</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Required Dispatch Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MOCK_FORWARDING.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{row.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationCity fontSize="small" sx={{ color: '#94A3B8' }}/>
                      {row.destination}
                    </Box>
                  </TableCell>
                  <TableCell>{row.nextWarehouse}</TableCell>
                  <TableCell sx={{ fontWeight: 500, color: row.dispatchDate === 'Today' ? '#EF4444' : '#0F172A' }}>
                    {row.dispatchDate}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={row.status.replace(/_/g, ' ')} 
                      sx={{ 
                        bgcolor: row.status === 'READY' ? alpha('#22C55E', 0.1) : alpha('#F59E0B', 0.1),
                        color: row.status === 'READY' ? '#22C55E' : '#F59E0B',
                        fontWeight: 700 
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {row.status === 'PENDING_LOGISTICS' ? (
                        <Button size="small" variant="outlined" startIcon={<LocalShipping />} sx={{ color: '#F59E0B', borderColor: alpha('#F59E0B', 0.5), textTransform: 'none', fontWeight: 600 }}>
                          Assign Logistics
                        </Button>
                      ) : (
                        <Button size="small" variant="outlined" startIcon={<QueuePlayNext />} sx={{ color: ORANGE, borderColor: alpha(ORANGE, 0.5), textTransform: 'none', fontWeight: 600 }}>
                          Generate Outbound
                        </Button>
                      )}
                      <Button size="small" variant="outlined" startIcon={<ForwardToInbox />} sx={{ color: '#3B82F6', borderColor: alpha('#3B82F6', 0.5), textTransform: 'none', fontWeight: 600 }}>
                        Notify Next
                      </Button>
                    </Box>
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
