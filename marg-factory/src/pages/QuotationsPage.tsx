import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  CircularProgress, Divider, Avatar,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  RequestQuote, CheckCircle, Cancel, Timer,
  LocalShipping, AttachMoney, Info, EvStation, Speed
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { logisticsApi } from '../api/endpoints';

export default function QuotationsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = () => {
    setLoading(true);
    logisticsApi.listChatRooms()
      .then(res => {
        const data = res.data.results || res.data || [];
        setRooms(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRooms();
  }, []);

  // Flatten all quotes from all chat rooms
  const allQuotes = rooms.flatMap(room =>
    (room.quotes || []).map((q: any) => {
      const priceVal = Number(q.price);
      let rateStatus = 'MARKET RANGE'; // Default if no estimate exists
      let rateColor = '#8A7F75'; 
      let rateBg = '#F3F4F6';
      
      // If backend later provides an estimated_price, we can calculate against it
      const estPrice = q.estimated_price ? Number(q.estimated_price) : null;
      
      if (estPrice) {
        if (priceVal < estPrice * 0.9) {
          rateStatus = 'BELOW MARKET';
          rateColor = '#16A34A'; // Green
          rateBg = '#F0FDF4';
        } else if (priceVal > estPrice * 1.1) {
          rateStatus = 'ABOVE MARKET';
          rateColor = '#DC2626'; // Red
          rateBg = '#FEF2F2';
        } else {
          rateStatus = 'MARKET RANGE';
          rateColor = '#CA8A04'; // Yellow
          rateBg = '#FEF9C3';
        }
      }

      return {
        ...q,
        companyName: room.logistics_company_name,
        lotNumber: room.lot_number,
        roomId: room.id,
        estPrice,
        rateStatus,
        rateColor,
        rateBg,
        estVehicle: q.estimated_vehicle || 'N/A',
        estDistance: q.estimated_distance || 'N/A',
        estFuel: q.estimated_fuel || 'N/A'
      };
    })
  );

  const handleAccept = async (quoteId: number) => {
    try {
      const res = await logisticsApi.acceptQuote(quoteId);
      alert(res.data.message || 'Quote accepted!');
      if (res.data.shipment_id) navigate(`/shipments/${res.data.shipment_id}`);
    } catch (e) {
      console.error(e);
      alert('Error accepting quote');
    }
  };

  const handleReject = async (quoteId: number) => {
    try {
      const res = await logisticsApi.rejectQuote(quoteId);
      alert(res.data.message || 'Quote rejected!');
      loadRooms();
    } catch (e) {
      console.error(e);
      alert('Error rejecting quote');
    }
  };

  const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    PENDING: { label: 'Pending', bg: '#FEF3C7', color: '#D97706' },
    ACCEPTED: { label: 'Accepted', bg: '#D1FAE5', color: '#059669' },
    REJECTED: { label: 'Rejected', bg: '#FEE2E2', color: '#DC2626' },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Quotations
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
            Review, accept, or reject transport quotations from logistics partners.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`${allQuotes.filter(q => q.status === 'PENDING').length} Pending`}
            sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 700 }} />
          <Chip label={`${allQuotes.filter(q => q.status === 'ACCEPTED').length} Accepted`}
            sx={{ bgcolor: '#D1FAE5', color: '#059669', fontWeight: 700 }} />
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
      ) : allQuotes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <RequestQuote sx={{ fontSize: 60, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#8A7F75' }}>No Quotations Yet</Typography>
            <Typography variant="body2" sx={{ color: '#B0A89E' }}>
              Quotations will appear here once logistics partners respond to your requests.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {allQuotes.map(quote => {
            const st = statusConfig[quote.status] || statusConfig.PENDING;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={quote.id}>
                <Card sx={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  border: quote.status === 'PENDING' ? '2px solid #F97316' : 'none',
                }}>
                  <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#FFF7ED', color: '#F97316', fontWeight: 700, width: 40, height: 40 }}>
                          {(quote.companyName || 'L').charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700, color: '#332922', fontSize: '0.9rem' }}>
                            {quote.companyName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#8A7F75' }}>
                            Lot: {quote.lotNumber}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip label={st.label} size="small"
                        sx={{ fontWeight: 700, borderRadius: '8px', bgcolor: st.bg, color: st.color }} />
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Price */}
                    <Box sx={{ textAlign: 'center', mb: 2, py: 2, bgcolor: '#FDFBF7', borderRadius: '12px' }}>
                      <Typography variant="caption" sx={{ color: '#8A7F75' }}>Quoted Price</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#F97316' }}>
                        {quote.currency || '₹'} {Number(quote.price).toLocaleString()}
                      </Typography>
                      <Chip 
                        label={quote.rateStatus} 
                        size="small" 
                        sx={{ mt: 1, fontWeight: 800, fontSize: '0.65rem', height: 20, bgcolor: quote.rateBg, color: quote.rateColor }} 
                      />
                    </Box>

                    {/* Estimator Details */}
                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '10px', p: 1.5, mb: 2 }}>
                      <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#8A7F75', fontWeight: 700, mb: 1 }}>
                        <Info sx={{ fontSize: 14 }} /> System Estimates
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid size={6}>
                          <Typography variant="caption" sx={{ color: '#B0A89E', display: 'block' }}>Market Rate</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#332922' }}>{quote.estPrice ? `₹ ${Math.round(quote.estPrice).toLocaleString()}` : 'N/A'}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" sx={{ color: '#B0A89E', display: 'block' }}>Vehicle</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#332922' }}>{quote.estVehicle}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" sx={{ color: '#B0A89E', display: 'block' }}>Distance</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#332922' }}>{quote.estDistance}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" sx={{ color: '#B0A89E', display: 'block' }}>Est. Fuel Cost</Typography>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#332922' }}>{quote.estFuel}</Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Details */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Timer sx={{ fontSize: 16, color: '#8A7F75' }} />
                        <Typography variant="body2" sx={{ color: '#8A7F75' }}>Transit Time</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#332922' }}>
                        {quote.estimated_delivery_hours || 'N/A'} hrs
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }} />

                    {/* Actions */}
                    {quote.status === 'PENDING' && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<CheckCircle />}
                          onClick={() => handleAccept(quote.id)}
                          sx={{ borderRadius: '10px' }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleReject(quote.id)}
                          sx={{ borderRadius: '10px', minWidth: 'auto', px: 2 }}
                        >
                          <Cancel />
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
