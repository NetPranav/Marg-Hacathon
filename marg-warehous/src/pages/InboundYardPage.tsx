import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, alpha, Grid2 as Grid,
  Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Divider,
} from '@mui/material';
import {
  Radar, CheckCircle, Cancel, SwapHoriz, AccessTime,
  LocalShipping, Anchor, Warning, Speed, Schedule,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docksApi, shipmentsApi, recommendationsApi, telemetryApi } from '@/api/endpoints';

const ORANGE = '#E8700A';
const BROWN = '#8B3A0E';

// ─── Inbound Radar Component ─────────────────────────────────────
function InboundRadarView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const sweepAngle = useRef(0);

  const { data: telData } = useQuery({
    queryKey: ['telemetry-latest'],
    queryFn: () => telemetryApi.latest(),
    refetchInterval: 10000,
  });
  const trucks = telData?.data?.data ?? [];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(cx, cy) - 20;

    ctx.clearRect(0, 0, w, h);

    // Background
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
    bgGrad.addColorStop(0, 'rgba(15, 23, 42, 1)');
    bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Grid rings
    for (let i = 1; i <= 4; i++) {
      const r = (maxR / 4) * i;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(232, 112, 10, ${0.04 + i * 0.02})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Cross hairs
    ctx.strokeStyle = 'rgba(232, 112, 10, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - maxR * 0.707, cy - maxR * 0.707); ctx.lineTo(cx + maxR * 0.707, cy + maxR * 0.707); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + maxR * 0.707, cy - maxR * 0.707); ctx.lineTo(cx - maxR * 0.707, cy + maxR * 0.707); ctx.stroke();

    // Sweep
    sweepAngle.current += 0.015;
    const sweepGrad = ('createConicGradient' in ctx) ? (ctx as any).createConicGradient(sweepAngle.current, cx, cy) : null;
    if (sweepGrad) {
      sweepGrad.addColorStop(0, `rgba(232, 112, 10, 0.15)`);
      sweepGrad.addColorStop(0.1, `rgba(232, 112, 10, 0)`);
    }
    // Fallback sweep line
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sweepAngle.current);
    const sweepLG = ctx.createLinearGradient(0, 0, maxR, 0);
    sweepLG.addColorStop(0, 'rgba(232, 112, 10, 0.3)');
    sweepLG.addColorStop(1, 'rgba(232, 112, 10, 0.05)');
    ctx.strokeStyle = sweepLG;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(maxR, 0); ctx.stroke();

    // Sweep arc
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, maxR, -0.3, 0);
    ctx.closePath();
    const arcGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
    arcGrad.addColorStop(0, 'rgba(232, 112, 10, 0.08)');
    arcGrad.addColorStop(1, 'rgba(232, 112, 10, 0.02)');
    ctx.fillStyle = arcGrad;
    ctx.fill();
    ctx.restore();

    // Center dot (warehouse)
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = ORANGE;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.strokeStyle = alpha(ORANGE, 0.4);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Distance labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 1; i <= 4; i++) {
      ctx.fillText(`${i * 5}km`, cx, cy - (maxR / 4) * i + 14);
    }

    // Truck blips
    const time = Date.now() / 1000;
    trucks.forEach((truck: any, idx: number) => {
      // Simulate positions around the radar
      const angle = ((idx * 2.4) + time * 0.1) % (Math.PI * 2);
      const dist = 0.3 + (idx * 0.15) % 0.7;
      const tx = cx + Math.cos(angle) * dist * maxR;
      const ty = cy + Math.sin(angle) * dist * maxR;

      // Pulse ring
      const pulseScale = 1 + Math.sin(time * 2 + idx) * 0.3;
      ctx.beginPath();
      ctx.arc(tx, ty, 8 * pulseScale, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 112, 10, ${0.1 / pulseScale})`;
      ctx.fill();

      // Blip dot
      ctx.beginPath();
      ctx.arc(tx, ty, 4, 0, Math.PI * 2);
      ctx.fillStyle = ORANGE;
      ctx.fill();

      // Connection line to center
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(tx, ty);
      ctx.lineTo(cx, cy);
      ctx.strokeStyle = `rgba(232, 112, 10, 0.12)`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = '#CBD5E1';
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(truck.truck_reg || `T-${idx + 1}`, tx, ty - 12);
    });

    // No truck data — show mock blips
    // No truck data
    if (trucks.length === 0) {
      // Intentionally left blank as requested (no mock data)
    }

    animRef.current = requestAnimationFrame(draw);
  }, [trucks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(2, 2);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {/* Overlay label */}
      <Box sx={{
        position: 'absolute', top: 12, left: 12,
        bgcolor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
        borderRadius: 2, px: 1.5, py: 0.8,
        border: '1px solid rgba(232, 112, 10, 0.15)',
      }}>
        <Typography sx={{ color: ORANGE, fontSize: '0.7rem', fontWeight: 700 }}>
          🛰️ LIVE INBOUND RADAR
        </Typography>
        <Typography sx={{ color: '#64748B', fontSize: '0.6rem' }}>
          20km geofence boundary
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Dock Gantt Chart ────────────────────────────────────────────
interface DockSlot {
  dockId: string;
  dockNumber: string;
  slots: Array<{
    shipment: string;
    start: number;
    end: number;
    status: 'active' | 'delayed' | 'upcoming' | 'completed';
  }>;
}

function DockGanttChart({ docks }: { docks: any[] }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 6AM - 6PM
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  // Empty real slots if endpoints aren't providing them
  const ganttData: DockSlot[] = docks.slice(0, 8).map((dock: any, i: number) => ({
    dockId: dock.id,
    dockNumber: dock.dock_number || `D-${String(i + 1).padStart(2, '0')}`,
    slots: [],
  }));

  const slotColor = (s: string) => {
    switch (s) {
      case 'active': return ORANGE;
      case 'delayed': return '#EF4444';
      case 'upcoming': return '#3B82F6';
      case 'completed': return '#22C55E';
      default: return '#64748B';
    }
  };

  return (
    <Box sx={{ overflowX: 'auto', pb: 1 }} className="dark-scroll">
      {/* Timeline header */}
      <Box sx={{ display: 'flex', ml: '100px', mb: 1 }}>
        {hours.map(h => (
          <Box key={h} sx={{ minWidth: 80, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>
              {h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Dock rows */}
      {ganttData.map((dock, di) => (
        <Box
          key={dock.dockId}
          sx={{
            display: 'flex', alignItems: 'center', mb: 0.8,
            animation: `fadeInUp 0.3s ease-out ${di * 0.05}s both`,
          }}
        >
          {/* Dock label */}
          <Box sx={{
            minWidth: 100, pr: 1.5,
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <Anchor sx={{ fontSize: 14, color: '#64748B' }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>
              {dock.dockNumber}
            </Typography>
          </Box>

          {/* Timeline track */}
          <Box sx={{
            flex: 1, position: 'relative', height: 36,
            bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.03)',
            minWidth: hours.length * 80,
          }}>
            {/* Current time indicator */}
            {currentHour >= 6 && currentHour <= 18 && (
              <Box sx={{
                position: 'absolute',
                left: `${((currentHour - 6) / 12) * 100}%`,
                top: 0, bottom: 0, width: 2,
                bgcolor: alpha(ORANGE, 0.4),
                zIndex: 2,
              }} />
            )}

            {/* Slots */}
            {dock.slots.map((slot, si) => {
              const left = ((slot.start - 6) / 12) * 100;
              const width = ((slot.end - slot.start) / 12) * 100;
              const color = slotColor(slot.status);
              return (
                <Tooltip
                  key={si}
                  title={`${slot.shipment} — ${slot.status.toUpperCase()}`}
                >
                  <Box sx={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${width}%`,
                    top: 4, bottom: 4,
                    bgcolor: alpha(color, 0.15),
                    border: `1.5px solid ${alpha(color, 0.4)}`,
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    animation: `ganttSlide 0.4s ease-out ${si * 0.1}s both`,
                    overflow: 'hidden',
                    '&:hover': {
                      bgcolor: alpha(color, 0.25),
                      transform: 'scaleY(1.1)',
                      zIndex: 5,
                    },
                  }}>
                    <Typography sx={{
                      fontSize: '0.6rem', fontWeight: 700, color,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      px: 0.5,
                    }}>
                      {slot.shipment}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// ─── Dock Status Cards ───────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  AVAILABLE: { label: 'Available', color: '#22C55E', icon: <CheckCircle /> },
  RESERVED: { label: 'Reserved', color: '#3B82F6', icon: <Schedule /> },
  OCCUPIED: { label: 'Occupied', color: '#EF4444', icon: <LocalShipping /> },
  MAINTENANCE: { label: 'Maintenance', color: '#F59E0B', icon: <Warning /> },
};

// ─── MAIN PAGE ───────────────────────────────────────────────────
export default function InboundYardPage() {
  const queryClient = useQueryClient();
  const [editDock, setEditDock] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');

  const { data: dockData, isLoading: docksLoading } = useQuery({
    queryKey: ['docks'],
    queryFn: () => docksApi.list({ page_size: 50 }),
    refetchInterval: 15000,
  });

  const { data: recData } = useQuery({
    queryKey: ['dock-recommendations'],
    queryFn: () => recommendationsApi.list(),
    refetchInterval: 15000,
  });

  const { data: shipmentData } = useQuery({
    queryKey: ['shipments', 'inbound-active'],
    queryFn: () => shipmentsApi.list(),
    refetchInterval: 15000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => docksApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docks'] });
      setEditDock(null);
    },
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => recommendationsApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dock-recommendations'] }),
  });

  const rejectMut = useMutation({
    mutationFn: (id: number) => recommendationsApi.reject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dock-recommendations'] }),
  });

  const reserveDockMut = useMutation({
    mutationFn: ({ id, dockId }: { id: number; dockId: number }) => shipmentsApi.reserveDock(id, { dock_id: dockId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments', 'inbound-active'] });
      queryClient.invalidateQueries({ queryKey: ['docks'] });
    },
  });

  const startUnloadingMut = useMutation({
    mutationFn: (id: number) => shipmentsApi.startUnloading(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipments', 'inbound-active'] }),
  });

  const completeMut = useMutation({
    mutationFn: (id: number) => shipmentsApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments', 'inbound-active'] });
      queryClient.invalidateQueries({ queryKey: ['docks'] });
    },
  });

  const docks = dockData?.data?.results ?? [];
  const recommendations = recData?.data?.results ?? [];
  const pendingRecs = recommendations.filter((r: any) => r.status === 'PENDING');
  
  const shipmentsList = Array.isArray(shipmentData?.data) ? shipmentData?.data : shipmentData?.data?.results || [];
  const activeShipments = shipmentsList.filter((s: any) => 
    ['APPROACHING_DESTINATION', 'ARRIVED_AT_GATE', 'RECEIVING_IN_PROGRESS', 'SLOTTING_IN_PROGRESS'].includes(s.status)
  );

  const statusCounts = {
    AVAILABLE: docks.filter((d: any) => d.status === 'AVAILABLE').length,
    RESERVED: docks.filter((d: any) => d.status === 'RESERVED').length,
    OCCUPIED: docks.filter((d: any) => d.status === 'OCCUPIED').length,
    MAINTENANCE: docks.filter((d: any) => d.status === 'MAINTENANCE').length,
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Inbound Yard & Dock Matrix
        </Typography>
        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
          Real-time inbound tracking, dock scheduling, and swap recommendations
        </Typography>
      </Box>

      {/* Dock Status Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(STATUS_CONFIG).map(([key, config], i) => (
          <Grid key={key} size={{ xs: 6, md: 3 }}>
            <Card sx={{
              animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both`,
              position: 'relative', overflow: 'hidden',
            }}>
              <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${config.color} 0%, ${alpha(config.color, 0.3)} 100%)`,
              }} />
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: `linear-gradient(135deg, ${alpha(config.color, 0.12)} 0%, ${alpha(config.color, 0.04)} 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: config.color, border: `1px solid ${alpha(config.color, 0.1)}`,
                }}>
                  {config.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#0F172A', lineHeight: 1 }}>
                    {statusCounts[key as keyof typeof statusCounts]}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500, mt: 0.3 }}>
                    {config.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content: Radar + Gantt */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Radar */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: 420, p: 0, overflow: 'hidden', bgcolor: '#0F172A' }}>
            <InboundRadarView />
          </Card>
        </Grid>

        {/* Gantt Chart */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: 420, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{
              px: 3, py: 2, borderBottom: '1px solid rgba(0,0,0,0.04)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Dynamic Dock Timeline</Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                  Today's scheduling • {docks.length} docks
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[
                  { label: 'Active', color: ORANGE },
                  { label: 'Delayed', color: '#EF4444' },
                  { label: 'Upcoming', color: '#3B82F6' },
                ].map(l => (
                  <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: l.color }} />
                    <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8' }}>{l.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
              <DockGanttChart docks={docks} />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Dock Swap Recommendations */}
      {pendingRecs.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHoriz sx={{ color: ORANGE }} />
            Auto-Swap Recommendations
            <Chip label={pendingRecs.length} size="small" sx={{
              bgcolor: alpha(ORANGE, 0.1), color: ORANGE, fontWeight: 700, fontSize: '0.7rem',
            }} />
          </Typography>
          <Grid container spacing={2}>
            {pendingRecs.slice(0, 4).map((rec: any, i: number) => (
              <Grid key={rec.id} size={{ xs: 12, md: 6 }}>
                <Card sx={{
                  border: `1.5px solid ${alpha(ORANGE, 0.15)}`,
                  animation: `fadeInUp 0.4s ease-out ${i * 0.1}s both`,
                  '&:hover': { borderColor: alpha(ORANGE, 0.3) },
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Chip
                        icon={<SwapHoriz sx={{ fontSize: 14 }} />}
                        label={rec.recommendation_type?.replace(/_/g, ' ')}
                        size="small"
                        sx={{ bgcolor: alpha(ORANGE, 0.08), color: ORANGE, fontWeight: 600 }}
                      />
                      <Chip label="PENDING" size="small" sx={{
                        bgcolor: alpha('#F59E0B', 0.1), color: '#F59E0B', fontWeight: 700, fontSize: '0.65rem',
                      }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 500, mb: 1.5 }}>
                      {rec.reason}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained" size="small" fullWidth
                        startIcon={<CheckCircle sx={{ fontSize: 16 }} />}
                        onClick={() => approveMut.mutate(rec.id)}
                        disabled={approveMut.isPending}
                        sx={{ fontSize: '0.78rem', py: 0.8 }}
                      >
                        Approve Swap
                      </Button>
                      <Button
                        variant="outlined" size="small" fullWidth color="error"
                        startIcon={<Cancel sx={{ fontSize: 16 }} />}
                        onClick={() => rejectMut.mutate(rec.id)}
                        disabled={rejectMut.isPending}
                        sx={{ fontSize: '0.78rem', py: 0.8 }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Dock Bay Grid */}
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>All Dock Bays</Typography>
      <Grid container spacing={1.5}>
        {docks.map((dock: any, i: number) => {
          const config = STATUS_CONFIG[dock.status] ?? STATUS_CONFIG.AVAILABLE;
          return (
            <Grid key={dock.id} size={{ xs: 4, sm: 3, md: 2 }}>
              <Card
                onClick={() => { setEditDock(dock); setNewStatus(dock.status); }}
                sx={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  border: `1.5px solid ${alpha(config.color, 0.15)}`,
                  transition: 'all 0.2s ease',
                  animation: `fadeInUp 0.3s ease-out ${i * 0.03}s both`,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    borderColor: config.color,
                    boxShadow: `0 4px 20px ${alpha(config.color, 0.15)}`,
                  },
                }}
              >
                <CardContent sx={{ py: 2, px: 1.5, '&:last-child': { pb: 2 } }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: '10px', mx: 'auto', mb: 1,
                    background: `linear-gradient(135deg, ${alpha(config.color, 0.12)} 0%, ${alpha(config.color, 0.04)} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: config.color,
                  }}>
                    <Anchor sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                    {dock.dock_number || `D-${dock.id}`}
                  </Typography>
                  <Chip
                    label={config.label} size="small"
                    sx={{
                      mt: 0.5, bgcolor: alpha(config.color, 0.08),
                      color: config.color, fontSize: '0.65rem', height: 22,
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Active Inbound Shipments */}
      <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Active Processing Shipments
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {activeShipments.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>No shipments currently processing in the yard.</Typography>
          </Grid>
        )}
        {activeShipments.map((s: any) => (
          <Grid key={s.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{s.shipment_number}</Typography>
                  <Chip 
                    label={s.status.replace(/_/g, ' ')} 
                    size="small" 
                    sx={{ 
                      bgcolor: s.status === 'WAITING_FOR_DOCK' ? alpha('#F59E0B', 0.1) : alpha('#3B82F6', 0.1),
                      color: s.status === 'WAITING_FOR_DOCK' ? '#F59E0B' : '#3B82F6',
                      fontWeight: 700, fontSize: '0.65rem'
                    }} 
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 0.5 }}><strong>Truck:</strong> {s.truck_reg || 'N/A'}</Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}><strong>Factory:</strong> {s.factory_name}</Typography>

                {s.status === 'WAITING_FOR_DOCK' && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField 
                      select 
                      size="small" 
                      fullWidth 
                      label="Select Dock" 
                      defaultValue=""
                      onChange={(e) => reserveDockMut.mutate({ id: s.id, dockId: Number(e.target.value) })}
                    >
                      {docks.filter((d: any) => d.status === 'AVAILABLE').map((d: any) => (
                        <MenuItem key={d.id} value={d.id}>Dock {d.dock_number}</MenuItem>
                      ))}
                    </TextField>
                  </Box>
                )}
                {s.status === 'DOCK_ASSIGNED' && (
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={() => startUnloadingMut.mutate(s.id)}
                    disabled={startUnloadingMut.isPending}
                    sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' } }}
                  >
                    Start Receiving
                  </Button>
                )}
                {s.status === 'RECEIVING_IN_PROGRESS' && (
                  <Button 
                    variant="contained" 
                    fullWidth 
                    onClick={() => completeMut.mutate(s.id)}
                    disabled={completeMut.isPending}
                    sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
                  >
                    Complete Shipment
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Edit Dialog */}
      <Dialog open={!!editDock} onClose={() => setEditDock(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Dock {editDock?.dock_number}</DialogTitle>
        <DialogContent>
          <TextField
            select fullWidth label="Status" value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)} sx={{ mt: 2 }}
          >
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDock(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => updateMutation.mutate({ id: editDock.id, status: newStatus })}
            disabled={updateMutation.isPending}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
