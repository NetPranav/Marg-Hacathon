import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, Button, 
  Rating, Chip, Avatar, CircularProgress, TextField
} from '@mui/material';
import { LocalShipping, Speed, VerifiedUser } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { logisticsApi, lotsApi } from '../api/endpoints';

export default function LogisticsDirectoryPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      logisticsApi.listCompanies(),
      lotsApi.list({ status: 'DRAFT' })
    ]).then(([compRes, lotRes]) => {
      setCompanies(compRes.data.results || []);
      setLots(lotRes.data.results || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleStartChat = async (companyId: number) => {
    if (lots.length === 0) {
      alert("You don't have any Draft Lots. Create a lot first.");
      navigate('/lots/new');
      return;
    }

    // Just use the first draft lot for simplicity
    const lotId = lots[0].id;
    try {
      const res = await logisticsApi.createChatRoom({
        logistics_company: companyId,
        lot: lotId,
        factory: lots[0].factory
      });
      navigate(`/logistics/chat/${res.data.id}`);
    } catch (e) {
      console.error(e);
      alert("Error starting chat");
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Logistics Partners</Typography>
          <Typography color="text.secondary">Find and negotiate with verified transport providers.</Typography>
        </Box>
        <TextField 
          variant="outlined" 
          placeholder="Search partners..." 
          size="small" 
          sx={{ width: 300, bgcolor: 'background.paper' }} 
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {companies.map((company) => (
            <Grid item xs={12} md={6} lg={4} key={company.id}>
              <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                        {company.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
                          {company.name}
                        </Typography>
                        <Rating value={Number(company.rating)} readOnly size="small" precision={0.1} />
                      </Box>
                    </Box>
                    <VerifiedUser color="success" />
                  </Box>
                  
                  <Box display="flex" gap={1} flexWrap="wrap" mb={3}>
                    {company.coverage_regions.map((region: string) => (
                      <Chip key={region} label={region} size="small" variant="outlined" />
                    ))}
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocalShipping fontSize="small" color="action" />
                        <Typography variant="body2">{company.fleet_size} Vehicles</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Speed fontSize="small" color="action" />
                        <Typography variant="body2">Avg {company.average_response_time_mins}m resp</Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={() => handleStartChat(company.id)}
                  >
                    Request Quote
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
