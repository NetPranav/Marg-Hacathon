import { Box, Typography, Grid2 as Grid, Card, CardContent, Chip, TextField, MenuItem } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docksApi, shipmentsApi } from '@/api/endpoints';
import { alpha } from '@mui/material/styles';

export default function DockAssignmentPage() {
  const queryClient = useQueryClient();

  const { data: docksData } = useQuery({
    queryKey: ['docks'],
    queryFn: () => docksApi.list({ page_size: 50 }),
    refetchInterval: 5000,
  });

  const { data: shipmentData } = useQuery({
    queryKey: ['warehouse-shipments'],
    queryFn: () => shipmentsApi.list({ 
      status__in: 'READY_FOR_DISPATCH,DISPATCHED,IN_TRANSIT,APPROACHING_DESTINATION,ARRIVED_AT_GATE',
      page_size: 50 
    }),
    refetchInterval: 5000,
  });

  const reserveDockMut = useMutation({
    mutationFn: ({ id, dockId }: { id: number; dockId: number }) => shipmentsApi.reserveDock(id, { dock_id: dockId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['docks'] });
    }
  });

  const docks = docksData?.data?.results || [];
  const shipmentsList = Array.isArray(shipmentData?.data) ? shipmentData?.data : shipmentData?.data?.results || [];

  return (
    <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
          Dock Assignment
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748B' }}>
          Assign incoming shipments to available dock bays before they arrive.
        </Typography>
      </Box>

      {shipmentsList.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px dashed #CBD5E1', boxShadow: 'none' }}>
          <Typography sx={{ color: '#64748B' }}>All inbound shipments currently have a dock assigned.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {shipmentsList.map((s: any) => (
            <Grid key={s.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card sx={{ 
                border: '1px solid rgba(0,0,0,0.08)', 
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
                      {s.shipment_number}
                    </Typography>
                    <Chip 
                      label={s.status.replace(/_/g, ' ')} 
                      size="small" 
                      sx={{ 
                        bgcolor: alpha('#F59E0B', 0.1),
                        color: '#F59E0B',
                        fontWeight: 700, fontSize: '0.7rem'
                      }} 
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      <strong>ETA:</strong> {s.expected_arrival_time ? new Date(s.expected_arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Pending'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      <strong>Factory:</strong> {s.factory_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569' }}>
                      <strong>Truck:</strong> {s.truck_reg || 'N/A'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField 
                      select 
                      size="small" 
                      fullWidth 
                      label="Assign Dock Bay" 
                      value={s.assigned_dock?.id || ""}
                      onChange={(e) => reserveDockMut.mutate({ id: s.id, dockId: Number(e.target.value) })}
                      disabled={reserveDockMut.isPending}
                    >
                      <MenuItem value="" disabled>Select Dock</MenuItem>
                      {docks.filter((d: any) => d.status === 'AVAILABLE' || d.id === s.assigned_dock?.id).map((d: any) => (
                        <MenuItem key={d.id} value={d.id}>Dock {d.dock_number}</MenuItem>
                      ))}
                    </TextField>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
