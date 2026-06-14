import React from 'react';
import { 
  Box, Typography, Card, CardContent, Chip, Button, 
  IconButton, Tooltip, Avatar, Divider 
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { 
  Warning, ErrorOutline, LocalShipping, CalendarToday,
  CheckCircleOutline, PersonAdd, ArrowForward, MoreVert
} from '@mui/icons-material';



const SEVERITY_COLORS: any = {
  CRITICAL: { bg: '#FEF2F2', text: '#DC2626' },
  HIGH: { bg: '#FFF7ED', text: '#EA580C' },
  MEDIUM: { bg: '#FEF9C3', text: '#CA8A04' },
  LOW: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function ExceptionsPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Exceptions Center
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
            Centralized hub for resolving operational roadblocks and issues.
          </Typography>
        </Box>
        <Button variant="contained" color="error" startIcon={<Warning />} sx={{ borderRadius: '8px' }}>
          Escalate All Critical
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <CheckCircleOutline sx={{ fontSize: 60, color: '#D1D5DB', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#8A7F75' }}>No Exceptions</Typography>
          <Typography variant="body2" sx={{ color: '#B0A89E' }}>
            All operations are running smoothly without any critical roadblocks.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
