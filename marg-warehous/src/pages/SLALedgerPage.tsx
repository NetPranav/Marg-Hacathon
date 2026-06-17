import { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Grid2 as Grid, alpha, Chip,
  Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Divider, Tooltip,
} from '@mui/material';
import {
  Warning, Timer, Gavel, Groups, Schedule, LocalShipping,
  TrendingUp, Download, Speed, PrecisionManufacturing, AccessTime,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, Cell } from 'recharts';
import { shipmentsApi } from '@/api/endpoints';

const ORANGE = '#E8700A';
const BROWN = '#8B3A0E';

// Free time threshold in minutes
const FREE_TIME_MINUTES = 180; // 3 hours

// ─── Live Countdown Component ────────────────────────────────────
function CountdownTimer({ arrivedAt, freeTimeMin }: { arrivedAt: string | null; freeTimeMin: number }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!arrivedAt) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - new Date(arrivedAt).getTime()) / 60000;
      setRemaining(Math.max(0, freeTimeMin - elapsed));
    }, 1000);
    return () => clearInterval(interval);
  }, [arrivedAt, freeTimeMin]);

  if (!arrivedAt) return <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>—</Typography>;

  const hrs = Math.floor(remaining / 60);
  const mins = Math.floor(remaining % 60);
  const secs = Math.floor((remaining * 60) % 60);
  const isUrgent = remaining < 30;
  const isViolation = remaining <= 0;
  const color = isViolation ? '#EF4444' : isUrgent ? '#F59E0B' : '#22C55E';

  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1.5, py: 0.5, borderRadius: 2,
      bgcolor: alpha(color, 0.08),
      border: `1.5px solid ${alpha(color, 0.2)}`,
      ...(isUrgent && !isViolation && { animation: 'countdownTick 1s ease-in-out infinite' }),
      ...(isViolation && { animation: 'slaFlash 1.2s ease-in-out infinite' }),
    }}>
      <Timer sx={{ fontSize: 16, color }} />
      <Typography sx={{
        fontWeight: 800, fontFamily: 'monospace', fontSize: '1rem',
        color, letterSpacing: '0.05em',
      }}>
        {isViolation ? 'BREACH' : `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`}
      </Typography>
    </Box>
  );
}

// ─── Mock data generators ────────────────────────────────────────
function generateShiftForecast(): any[] {
  return [
    { time: '08:00', volume: 12, isPeak: false },
    { time: '09:00', volume: 18, isPeak: false },
    { time: '10:00', volume: 25, isPeak: true },
    { time: '11:00', volume: 14, isPeak: false },
  ];
}

function generateChargebackHistory(): any[] {
  return [
    { id: 1, shipment: 'SHP-9988', penalty: 4500, truck: 'MH12-AB-1234', factory: 'Pune Hub', gateIn: '10:15 AM', gateOut: '02:30 PM', date: 'Oct 24' },
    { id: 2, shipment: 'SHP-7766', penalty: 2000, truck: 'MH14-CD-5678', factory: 'Mumbai Plant', gateIn: '11:00 AM', gateOut: '01:45 PM', date: 'Oct 23' },
  ];
}

export default function SLALedgerPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sla-shipments'],
    queryFn: () => shipmentsApi.list({
      status__in: 'APPROACHING_DESTINATION,ARRIVED_AT_GATE,RECEIVING_IN_PROGRESS,SLOTTING_IN_PROGRESS',
      page_size: 50,
    }),
    refetchInterval: 10000,
  });

  const shipments = data?.data?.results ?? [];
  const shiftForecast = generateShiftForecast();
  const chargebacks = generateChargebackHistory();

  // Calculate detention data
  const detentionData = shipments.map((s: any) => {
    const arrivedAt = s.arrived_at ? new Date(s.arrived_at) : null;
    const now = new Date();
    const waitMinutes = arrivedAt ? Math.round((now.getTime() - arrivedAt.getTime()) / 60000) : 0;
    const remainingFreeTime = FREE_TIME_MINUTES - waitMinutes;
    const isAtRisk = remainingFreeTime < 30 && remainingFreeTime > 0;
    const isViolation = remainingFreeTime <= 0;
    return { ...s, waitMinutes, remainingFreeTime, isAtRisk, isViolation };
  });

  const violations = detentionData.filter((d: any) => d.isViolation).length;
  const atRisk = detentionData.filter((d: any) => d.isAtRisk).length;
  const totalPenalty = chargebacks.reduce((s, c) => s + c.penalty, 0);

  // Sort: violations first, then at-risk, then by wait time
  const sortedDetention = [...detentionData].sort((a, b) => {
    if (a.isViolation !== b.isViolation) return a.isViolation ? -1 : 1;
    if (a.isAtRisk !== b.isAtRisk) return a.isAtRisk ? -1 : 1;
    return b.waitMinutes - a.waitMinutes;
  });

  // Peak hour from forecast
  const peakHour = shiftForecast.reduce((max, h) => h.volume > max.volume ? h : max, shiftForecast[0]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Resource Forecaster & SLA Ledger
        </Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          Workforce planning, free-time countdowns, and detention chargeback management
        </Typography>
      </Box>

      {/* Summary KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { icon: <Warning />, label: 'SLA Violations', value: violations, color: '#EF4444' },
          { icon: <AccessTime />, label: 'At Risk (< 30 min)', value: atRisk, color: '#F59E0B' },
          { icon: <LocalShipping />, label: 'At Warehouse', value: detentionData.length, color: '#3B82F6' },
          { icon: <Gavel />, label: 'Total Penalties (Week)', value: `₹${totalPenalty.toLocaleString('en-IN')}`, color: '#EF4444' },
        ].map((kpi, i) => (
          <Grid key={kpi.label} size={{ xs: 6, md: 3 }}>
            <Card sx={{
              position: 'relative', overflow: 'hidden',
              animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both`,
            }}>
              <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${kpi.color} 0%, ${alpha(kpi.color, 0.3)} 100%)`,
              }} />
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: `linear-gradient(135deg, ${alpha(kpi.color, 0.12)} 0%, ${alpha(kpi.color, 0.04)} 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: kpi.color, border: `1px solid ${alpha(kpi.color, 0.1)}`,
                }}>
                  {kpi.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: '#0F172A', lineHeight: 1.1 }}>
                    {kpi.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 500, mt: 0.3 }}>
                    {kpi.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Three-panel Layout */}
      <Grid container spacing={2.5}>

        {/* LEFT: Shift Predictor */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Card sx={{ height: 520, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Groups sx={{ color: ORANGE, fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Shift Predictor</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>Next 12 hours forecast</Typography>
            </Box>
            <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Recommendation box */}
              <Box sx={{
                p: 1.5, borderRadius: '12px', mb: 2,
                bgcolor: alpha(ORANGE, 0.04),
                border: `1px solid ${alpha(ORANGE, 0.1)}`,
              }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#0F172A', fontWeight: 500, lineHeight: 1.5 }}>
                  Peak volume expected at <strong style={{ color: ORANGE }}>{peakHour.time}</strong>.
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748B', mt: 0.5, lineHeight: 1.5 }}>
                  <strong>Recommendation:</strong> Shift 4 extra forklift operators and 12 manual loaders to North Wing docks.
                </Typography>
              </Box>

              {/* Mini chart */}
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={shiftForecast} barCategoryGap="20%">
                    <XAxis
                      dataKey="time" axisLine={false} tickLine={false}
                      tick={{ fontSize: 8, fill: '#94A3B8' }}
                      interval={1}
                    />
                    <YAxis
                      axisLine={false} tickLine={false} hide
                    />
                    <ChartTooltip
                      contentStyle={{
                        borderRadius: 10, border: 'none',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="volume" name="Trucks" radius={[4, 4, 2, 2]}>
                      {shiftForecast.map((entry, index) => (
                        <Cell key={index} fill={entry.isPeak ? ORANGE : alpha(ORANGE, 0.3)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              {/* Resource cards */}
              <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                <Box sx={{
                  flex: 1, p: 1.5, borderRadius: '10px',
                  bgcolor: alpha('#3B82F6', 0.05),
                  border: `1px solid ${alpha('#3B82F6', 0.1)}`,
                  textAlign: 'center',
                }}>
                  <PrecisionManufacturing sx={{ fontSize: 18, color: '#3B82F6' }} />
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>8</Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8' }}>Forklifts</Typography>
                </Box>
                <Box sx={{
                  flex: 1, p: 1.5, borderRadius: '10px',
                  bgcolor: alpha('#22C55E', 0.05),
                  border: `1px solid ${alpha('#22C55E', 0.1)}`,
                  textAlign: 'center',
                }}>
                  <Groups sx={{ fontSize: 18, color: '#22C55E' }} />
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>24</Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8' }}>Loaders</Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* CENTER: Live SLA Countdown */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: 520, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{
              px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.04)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Timer sx={{ color: ORANGE, fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Live Free-Time Countdown</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  SLA Threshold: {FREE_TIME_MINUTES / 60} hours
                </Typography>
              </Box>
              <Chip label={`${detentionData.length} trucks`} size="small" sx={{
                bgcolor: alpha('#3B82F6', 0.08), color: '#3B82F6', fontWeight: 600, fontSize: '0.7rem',
              }} />
            </Box>
            <TableContainer sx={{ flex: 1, overflow: 'auto' }} className="dark-scroll">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.68rem' }}>TRUCK</TableCell>
                    <TableCell sx={{ fontSize: '0.68rem' }}>SHIPMENT</TableCell>
                    <TableCell sx={{ fontSize: '0.68rem' }}>STATUS</TableCell>
                    <TableCell sx={{ fontSize: '0.68rem' }} align="right">FREE TIME LEFT</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>Loading...</TableCell></TableRow>
                  ) : sortedDetention.length === 0 ? (
                    <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>No trucks at warehouse</TableCell></TableRow>
                  ) : sortedDetention.map((s: any, i: number) => (
                    <TableRow
                      key={s.id}
                      sx={{
                        animation: `fadeInUp 0.3s ease-out ${i * 0.04}s both`,
                        ...(s.isViolation && { animation: 'slaFlash 1.5s ease-in-out infinite' }),
                      }}
                    >
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.78rem', color: '#0F172A' }}>
                          {s.truck_registration || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {s.shipment_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={s.status?.replace(/_/g, ' ')}
                          size="small"
                          sx={{
                            height: 22, fontSize: '0.6rem',
                            bgcolor: alpha(ORANGE, 0.08), color: ORANGE,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <CountdownTimer arrivedAt={s.arrived_at} freeTimeMin={FREE_TIME_MINUTES} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* RIGHT: Detention Chargebacks */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: 520, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{
              px: 2.5, py: 2, borderBottom: '1px solid rgba(0,0,0,0.04)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Gavel sx={{ color: '#EF4444', fontSize: 20 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Detention Chargebacks</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>Historical penalties</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1.5 }} className="dark-scroll">
              {chargebacks.map((cb, i) => (
                <Box
                  key={cb.id}
                  sx={{
                    p: 1.5, borderRadius: '12px', mb: 1,
                    border: '1px solid rgba(0,0,0,0.04)',
                    bgcolor: 'rgba(0,0,0,0.01)',
                    animation: `fadeInUp 0.3s ease-out ${i * 0.08}s both`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: alpha('#EF4444', 0.15),
                      bgcolor: alpha('#EF4444', 0.02),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', fontFamily: 'monospace', color: '#0F172A' }}>
                      {cb.shipment}
                    </Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#EF4444' }}>
                      ₹{cb.penalty.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
                    <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                      🚛 {cb.truck}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                      🏭 {cb.factory}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={`In: ${cb.gateIn}`} size="small" sx={{
                        height: 20, fontSize: '0.6rem', bgcolor: alpha('#22C55E', 0.08), color: '#22C55E',
                      }} />
                      <Chip label={`Out: ${cb.gateOut}`} size="small" sx={{
                        height: 20, fontSize: '0.6rem', bgcolor: alpha('#EF4444', 0.08), color: '#EF4444',
                      }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.62rem', color: '#94A3B8' }}>{cb.date}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Export button */}
            <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.04)' }}>
              <Button
                variant="outlined" fullWidth size="small"
                startIcon={<Download sx={{ fontSize: 16 }} />}
                sx={{
                  borderColor: alpha('#EF4444', 0.3), color: '#EF4444',
                  fontSize: '0.78rem',
                  '&:hover': { bgcolor: alpha('#EF4444', 0.04), borderColor: '#EF4444' },
                }}
              >
                Export Proof for Dispute
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
