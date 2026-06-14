import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Button, Skeleton } from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  LocalShipping, PendingActions, CheckCircle, Warning,
  DirectionsCar, Speed, TrendingUp, Add,
  Assignment, Storefront, Map, BarChart,
  Inventory2, FactCheck, HourglassTop, DoneAll, CalendarMonth,
  CalendarToday, Forum, NotificationImportant
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid } from 'recharts';
import { dashboardApi, shipmentsApi } from '@/api/endpoints';
import { STATUS_COLORS } from '@/theme/statusColors';

const METRIC_CARDS = [
  { key: 'ready_dispatch', label: 'READY FOR DISPATCH', icon: <CheckCircle sx={{ color: '#22C55E' }} />, bg: '#F0FDF4', trend: '—' },
  { key: 'awaiting_approval', label: 'AWAITING APPROVAL', icon: <HourglassTop sx={{ color: '#F59E0B' }} />, bg: '#FFF7ED', trend: '—' },
  { key: 'scheduled_today', label: 'SCHEDULED TODAY', icon: <CalendarToday sx={{ color: '#3B82F6' }} />, bg: '#EFF6FF', trend: '—' },
  { key: 'critical_exceptions', label: 'CRITICAL EXCEPTIONS', icon: <Warning sx={{ color: '#EF4444' }} />, bg: '#FEF2F2', trend: '—' },
  { key: 'unread_conversations', label: 'UNREAD CONVERSATIONS', icon: <Forum sx={{ color: '#8B5CF6' }} />, bg: '#F5F3FF', trend: '—' },
  { key: 'warehouse_alerts', label: 'WAREHOUSE ALERTS', icon: <NotificationImportant sx={{ color: '#EAB308' }} />, bg: '#FEF9C3', trend: '—' },
];

const QUICK_ACTIONS = [
  { label: 'Create New Lot', icon: <Add />, path: '/lots/new', bg: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)', color: '#fff' },
  { label: 'Schedule Dispatch', icon: <CalendarMonth />, path: '/dispatch-calendar', bg: '#FFF', color: '#332922' },
  { label: 'Review Exceptions', icon: <Warning />, path: '/exceptions', bg: '#FFF', color: '#332922' },
  { label: 'Track Shipment', icon: <Map />, path: '/lot-traceability', bg: '#FFF', color: '#332922' },
];

const WORKFLOW_STATUS = [
  { label: 'Draft Lots', count: 0, path: '/lots', bg: '#FFF7ED', color: '#EA580C', icon: <Assignment sx={{ fontSize: 20 }} /> },
  { label: 'Awaiting Warehouse', count: 0, path: '/pending-approvals', bg: '#FEF3C7', color: '#D97706', icon: <HourglassTop sx={{ fontSize: 20 }} /> },
  { label: 'Awaiting Driver Arrival', count: 0, path: '/shipments', bg: '#DBEAFE', color: '#2563EB', icon: <Storefront sx={{ fontSize: 20 }} /> },
  { label: 'Awaiting Cargo Acceptance', count: 0, path: '/shipments', bg: '#F0FDF4', color: '#16A34A', icon: <FactCheck sx={{ fontSize: 20 }} /> },
  { label: 'Active Shipments', count: 0, path: '/shipments', bg: '#EFF6FF', color: '#3B82F6', icon: <LocalShipping sx={{ fontSize: 20 }} /> },
  { label: 'Completed', count: 0, path: '/completed-shipments', bg: '#D1FAE5', color: '#059669', icon: <DoneAll sx={{ fontSize: 20 }} /> },
];

const PIE_COLORS = ['#F97316', '#3B82F6', '#22C55E', '#EF4444', '#8B5CF6', '#6B7280'];

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['factory-dashboard'],
    queryFn: () => dashboardApi.getFactoryDashboard(),
    refetchInterval: 30000,
  });

  const { data: transitData } = useQuery({
    queryKey: ['transit-live'],
    queryFn: () => dashboardApi.getTransitLive(),
    refetchInterval: 30000,
  });

  const { data: shipmentsData } = useQuery({
    queryKey: ['shipments', { page_size: 5 }],
    queryFn: () => shipmentsApi.list({ page_size: 5 }),
  });

  const dash = dashData?.data?.data ?? {};
  const transit = transitData?.data?.data ?? {};
  const recentShipments = shipmentsData?.data?.results ?? [];

  const pieData = transit.shipments ? [
    { name: 'In Transit', value: transit.shipments?.in_transit ?? 0 },
    { name: 'Ready for Transit', value: transit.shipments?.ready_for_transit ?? 0 },
    { name: 'At Warehouse', value: transit.shipments?.at_warehouse ?? 0 },
  ].filter(d => d.value > 0) : [];

  // Trend data — empty until real historical data is available
  const trendData: any[] = [];

  return (
    <Box>
      {/* Welcome */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Operations Hub 👋
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#8A7F75' }}>Here's what's happening with your logistics today.</Typography>
        </Box>
      </Box>

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {QUICK_ACTIONS.map(qa => (
          <Button
            key={qa.label}
            onClick={() => navigate(qa.path)}
            startIcon={qa.icon}
            sx={{
              borderRadius: '12px', px: 2.5, py: 1.2,
              background: qa.bg, color: qa.color,
              fontWeight: 700, fontSize: '0.82rem',
              boxShadow: '0 4px 20px rgba(214, 204, 194, 0.3)',
              border: qa.color === '#332922' ? '1px solid rgba(0,0,0,0.06)' : 'none',
              '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 8px 30px rgba(214, 204, 194, 0.5)' },
              transition: 'all 0.2s',
            }}
          >
            {qa.label}
          </Button>
        ))}
      </Box>

      {/* Workflow Status Widgets */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {WORKFLOW_STATUS.map(ws => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={ws.label}>
            <Card
              onClick={() => navigate(ws.path)}
              sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)' }, transition: 'transform 0.2s' }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: ws.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1, color: ws.color }}>
                  {ws.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: ws.color, lineHeight: 1 }}>{ws.count}</Typography>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#8A7F75', mt: 0.5, lineHeight: 1.2 }}>{ws.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {METRIC_CARDS.map((m) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={m.key}>
            <Card sx={{ borderRadius: '24px' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '16px',
                  bgcolor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.icon}
                </Box>
                <Box flexGrow={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#8A7F75', letterSpacing: '0.5px' }}>
                      {m.label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    {dashLoading ? (
                      <Skeleton width={40} height={36} />
                    ) : (
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922', lineHeight: 1 }}>
                        {dash[m.key] ?? 0}
                      </Typography>
                    )}
                    <Chip 
                      label={m.trend} 
                      size="small" 
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#D1FAE5', color: '#059669', borderRadius: '6px' }} 
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>



      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Delivery Trend */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%', borderRadius: '24px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Shipment Volume Timeline</Typography>
                  <Typography variant="body2" sx={{ color: '#8A7F75' }}>7-day dispatch efficiency</Typography>
                </Box>
                <Chip label="• Live" size="small" sx={{ bgcolor: '#D1FAE5', color: '#059669', fontWeight: 700, borderRadius: '8px' }} />
              </Box>
              <Box sx={{ height: 280 }}>
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

        {/* Shipment Status */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', borderRadius: '24px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Status Distribution</Typography>
              <Typography variant="body2" sx={{ color: '#8A7F75', mb: 3 }}>Active load allocation</Typography>
              
              {pieData.length > 0 ? (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ReTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(214, 204, 194, 0.4)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#9CA3AF' }}>No active shipments</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 2 }}>
                {pieData.map((d, i) => (
                  <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PIE_COLORS[i] }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fleet Stats + Recent Shipments */}
      <Grid container spacing={2.5}>
        {/* Fleet */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Fleet Overview</Typography>
              {[
                { label: 'Total Trucks', value: transit.fleet?.total_trucks ?? 0, color: '#3B82F6' },
                { label: 'Active', value: transit.fleet?.active ?? 0, color: '#F97316' },
                { label: 'Available', value: transit.fleet?.available ?? 0, color: '#22C55E' },
                { label: 'Utilization', value: `${transit.fleet?.utilization_pct ?? 0}%`, color: '#8B5CF6' },
              ].map((s) => (
                <Box key={s.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <Typography variant="body2" sx={{ color: '#6B7280' }}>{s.label}</Typography>
                  <Typography variant="subtitle1" sx={{ color: s.color, fontWeight: 700 }}>{s.value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Shipments */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: '24px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Latest Incoming Shipments</Typography>
                <Button size="small" variant="contained" color="primary" sx={{ borderRadius: '8px', px: 2 }} onClick={() => navigate('/shipments')}>View All →</Button>
              </Box>
              {recentShipments.map((s: any) => {
                const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.DRAFT;
                return (
                  <Box key={s.id} onClick={() => navigate(`/shipments/${s.id}`)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 3, py: 2,
                      borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer',
                      transition: 'background 0.2s',
                      '&:hover': { bgcolor: 'rgba(249, 115, 22, 0.02)' }, borderRadius: '12px', px: 2
                    }}
                  >
                    <Box sx={{ 
                      width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(249, 115, 22, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <LocalShipping sx={{ color: '#EA580C' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#332922' }}>
                        {s.shipment_number}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8A7F75', fontWeight: 500 }}>
                        {s.factory_name} → {s.warehouse_name}
                      </Typography>
                    </Box>
                    <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, borderRadius: '8px' }} />
                  </Box>
                );
              })}
              {recentShipments.length === 0 && (
                <Typography variant="body2" sx={{ py: 4, textAlign: 'center', color: '#8A7F75' }}>
                  No shipments yet. Create your first one!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
