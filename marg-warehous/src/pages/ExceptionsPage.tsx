import { Box, Typography, Card, CardContent, Grid, Chip, IconButton, Avatar, alpha, Button } from '@mui/material';
import { Warning, CheckCircle, AssignmentInd, Comment, ErrorOutline } from '@mui/icons-material';

const MOCK_EXCEPTIONS: any[] = [];

const SEVERITY_COLORS: Record<string, string> = {
  'Critical': '#EF4444',
  'High': '#F97316',
  'Medium': '#F59E0B',
  'Low': '#3B82F6'
};

export default function ExceptionsPage() {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Exceptions Center
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Centralize and resolve operational issues, dock conflicts, and discrepancies.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {MOCK_EXCEPTIONS.map((exc) => (
          <Grid item xs={12} md={6} key={exc.id}>
            <Card sx={{ 
              borderRadius: 3, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)', 
              borderLeft: `4px solid ${SEVERITY_COLORS[exc.severity]}`,
              opacity: exc.status === 'RESOLVED' ? 0.7 : 1
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      width: 40, height: 40, borderRadius: '10px', 
                      bgcolor: alpha(SEVERITY_COLORS[exc.severity], 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: SEVERITY_COLORS[exc.severity]
                    }}>
                      <Warning />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{exc.type}</Typography>
                      <Typography variant="caption" sx={{ color: '#64748B', fontFamily: 'monospace' }}>
                        {exc.id} • {exc.shipmentId}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={exc.severity} 
                    size="small" 
                    sx={{ 
                      bgcolor: alpha(SEVERITY_COLORS[exc.severity], 0.1), 
                      color: SEVERITY_COLORS[exc.severity], 
                      fontWeight: 700 
                    }} 
                  />
                </Box>

                <Typography variant="body2" sx={{ color: '#334155', mb: 2, p: 1.5, bgcolor: alpha('#F1F5F9', 0.5), borderRadius: 2 }}>
                  {exc.description}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<CheckCircle />} sx={{ color: '#22C55E', borderColor: alpha('#22C55E', 0.5), textTransform: 'none', fontWeight: 600 }}>
                      Resolve
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<ErrorOutline />} sx={{ color: '#EF4444', borderColor: alpha('#EF4444', 0.5), textTransform: 'none', fontWeight: 600 }}>
                      Escalate
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" sx={{ color: '#64748B' }}>
                      <AssignmentInd fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#64748B' }}>
                      <Comment fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
