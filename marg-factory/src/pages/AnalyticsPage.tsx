import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { dashboardApi } from '@/api/endpoints';
import { Speed, CheckCircle, Timer, TrendingUp } from '@mui/icons-material';

const COLORS = ['#F97316', '#3B82F6', '#22C55E', '#EF4444', '#8B5CF6'];

export default function AnalyticsPage() {
  const { data: transitData } = useQuery({
    queryKey: ['transit-live-analytics'],
    queryFn: () => dashboardApi.getTransitLive(),
  });

  const transit = transitData?.data?.data ?? {};

  const METRIC_CARDS = [
    { label: 'On-Time Delivery', value: `${transit.performance?.on_time_delivery_pct ?? 0}%`, icon: <CheckCircle />, color: '#22C55E', bg: '#F0FDF4' },
    { label: 'Fleet Utilization', value: `${transit.fleet?.utilization_pct ?? 0}%`, icon: <Speed />, color: '#F97316', bg: '#FFF7ED' },
    { label: 'Total Shipments', value: transit.performance?.total_shipments ?? 0, icon: <TrendingUp />, color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Dock Utilization', value: `${transit.docks?.utilization_pct ?? 0}%`, icon: <Timer />, color: '#8B5CF6', bg: '#F5F3FF' },
  ];

  // Shipment volume trend
  const trendData: any[] = [];

  // Status pie
  const statusData = transit.shipments ? [
    { name: 'In Transit', value: transit.shipments?.in_transit ?? 0 },
    { name: 'Ready for Transit', value: transit.shipments?.ready_for_transit ?? 0 },
    { name: 'At Warehouse', value: transit.shipments?.at_warehouse ?? 0 },
  ].filter(d => d.value > 0) : [];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Analytics</Typography>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {METRIC_CARDS.map((m) => (
          <Grid size={{ xs: 6, md: 3 }} key={m.label}>
            <Card>
              <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '14px', bgcolor: m.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color,
                }}>
                  {m.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181B', lineHeight: 1.2 }}>{m.value}</Typography>
                  <Typography variant="caption" sx={{ color: '#6B7280' }}>{m.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        {/* Volume Chart */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Shipment Volume</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EA580C" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#EA580C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8A7F75', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8A7F75', fontSize: 12 }} dx={-10} />
                    <ReTooltip cursor={{ fill: 'rgba(234, 88, 12, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(214, 204, 194, 0.4)' }} />
                    <Area type="monotone" dataKey="shipments" stroke="#EA580C" strokeWidth={3} fill="url(#orangeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Status Distribution</Typography>
              <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <ReTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography variant="body2" sx={{ color: '#9CA3AF' }}>No data</Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 1 }}>
                {statusData.map((d, i) => (
                  <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS[i] }} />
                    <Typography variant="caption">{d.name} ({d.value})</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
