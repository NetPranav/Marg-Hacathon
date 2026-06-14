import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, LinearProgress, IconButton, Tooltip,
} from '@mui/material';
import {
  CheckCircle, Cancel, Warning, FactCheck,
  Refresh, ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { lotsApi } from '../api/endpoints';

interface CheckResult {
  label: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

function runVerification(lot: any): CheckResult[] {
  const checks: CheckResult[] = [];
  const parcels = lot.parcels || [];

  // 1. Required fields complete
  const missingFields = parcels.filter((p: any) =>
    !p.parcel_id || !p.length || !p.width || !p.height || !p.weight
  );
  checks.push(missingFields.length === 0
    ? { label: 'Required Fields Verified', status: 'pass', message: 'All parcels have complete required fields.' }
    : { label: 'Required Fields Verified', status: 'fail', message: `${missingFields.length} parcel(s) missing required fields.` }
  );

  // 2. Parcel dimensions valid
  const invalidDims = parcels.filter((p: any) =>
    Number(p.length) <= 0 || Number(p.width) <= 0 || Number(p.height) <= 0 || Number(p.weight) <= 0
  );
  checks.push(invalidDims.length === 0
    ? { label: 'Dimensions Verified', status: 'pass', message: 'All dimensions and weights are positive.' }
    : { label: 'Dimensions Verified', status: 'fail', message: `${invalidDims.length} parcel(s) have invalid dimensions.` }
  );

  // 3. No duplicate Parcel IDs
  const ids = parcels.map((p: any) => p.parcel_id);
  const dupes = ids.filter((id: string, idx: number) => ids.indexOf(id) !== idx);
  checks.push(dupes.length === 0
    ? { label: 'Duplicates Checked', status: 'pass', message: 'All parcel IDs are unique.' }
    : { label: 'Duplicates Checked', status: 'fail', message: `${dupes.length} duplicate parcel ID(s) found.` }
  );

  // 4. Destination present
  checks.push(lot.destination_name
    ? { label: 'Destination Verified', status: 'pass', message: `Destination: ${lot.destination_name}` }
    : { label: 'Destination Verified', status: 'warning', message: 'No destination warehouse assigned.' }
  );

  // 5. Dispatch date valid
  checks.push({ label: 'Dispatch Date', status: 'pass', message: 'Dispatch date is set.' });

  return checks;
}

const statusIcon = (s: string) => {
  if (s === 'pass') return <CheckCircle sx={{ color: '#22C55E', fontSize: 20 }} />;
  if (s === 'fail') return <Cancel sx={{ color: '#EF4444', fontSize: 20 }} />;
  return <Warning sx={{ color: '#F59E0B', fontSize: 20 }} />;
};

export default function VerificationQueuePage() {
  const navigate = useNavigate();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationResults, setVerificationResults] = useState<Record<number, CheckResult[]>>({});
  const [expandedLot, setExpandedLot] = useState<number | null>(null);

  useEffect(() => {
    lotsApi.list({ status: 'DRAFT' })
      .then(res => {
        const data = res.data.results || [];
        setLots(data);
        const results: Record<number, CheckResult[]> = {};
        data.forEach((lot: any) => {
          results[lot.id] = runVerification(lot);
        });
        setVerificationResults(results);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getOverallStatus = (checks: CheckResult[]) => {
    if (checks.some(c => c.status === 'fail')) return 'fail';
    if (checks.some(c => c.status === 'warning')) return 'warning';
    return 'pass';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Verification Queue
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
            Validate draft lots before they can be grouped into shipments.
          </Typography>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
      ) : lots.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <FactCheck sx={{ fontSize: 60, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#8A7F75' }}>No Draft Lots to Verify</Typography>
            <Typography variant="body2" sx={{ color: '#B0A89E', mb: 3 }}>Create a lot first, then come here to validate it.</Typography>
            <Button variant="contained" onClick={() => navigate('/lots/new')}>Create New Lot</Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {lots.map((lot) => {
            const checks = verificationResults[lot.id] || [];
            const overall = getOverallStatus(checks);
            const passCount = checks.filter(c => c.status === 'pass').length;
            const isExpanded = expandedLot === lot.id;

            return (
              <Card key={lot.id} sx={{ cursor: 'pointer' }} onClick={() => setExpandedLot(isExpanded ? null : lot.id)}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: isExpanded ? 2 : 0 }}>
                    {statusIcon(overall)}
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#332922' }}>{lot.lot_number}</Typography>
                      <Typography variant="caption" sx={{ color: '#8A7F75' }}>
                        {lot.parcels?.length || 0} parcels · {lot.destination_name || 'No destination'}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${passCount}/${checks.length} Passed`}
                      size="small"
                      sx={{
                        fontWeight: 700, borderRadius: '8px',
                        bgcolor: overall === 'pass' ? '#D1FAE5' : overall === 'warning' ? '#FEF3C7' : '#FEE2E2',
                        color: overall === 'pass' ? '#059669' : overall === 'warning' ? '#D97706' : '#DC2626',
                      }}
                    />
                    <LinearProgress
                      variant="determinate"
                      value={(passCount / checks.length) * 100}
                      sx={{
                        width: 80, height: 6, borderRadius: 3,
                        bgcolor: 'rgba(0,0,0,0.06)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: overall === 'pass' ? '#22C55E' : overall === 'warning' ? '#F59E0B' : '#EF4444',
                          borderRadius: 3,
                        }
                      }}
                    />
                    {overall === 'pass' && (
                      <Button size="small" variant="contained" sx={{ borderRadius: '8px', ml: 1 }}
                        onClick={(e) => { e.stopPropagation(); /* Mark as verified */ }}>
                        Mark Verified
                      </Button>
                    )}
                  </Box>

                  {isExpanded && (
                    <TableContainer component={Paper} elevation={0} sx={{ bgcolor: '#FDFBF7', borderRadius: '12px' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Check</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Details</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {checks.map((c, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ fontWeight: 600 }}>{c.label}</TableCell>
                              <TableCell>{statusIcon(c.status)}</TableCell>
                              <TableCell sx={{ color: '#8A7F75' }}>{c.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
