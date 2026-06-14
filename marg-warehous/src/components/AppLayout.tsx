import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Badge, Tooltip,
  useMediaQuery, useTheme, Divider, alpha,
} from '@mui/material';
import {
  Dashboard, LocalShipping, ViewInAr,
  Notifications, Menu as MenuIcon, Logout,
  Radar, Inventory2, Gavel, ChevronLeft,
  CalendarMonth, FactCheck, Anchor, BookOnline, MeetingRoom, ChecklistRtl,
  Warning, Forum, Place, Search, QueuePlayNext, EventNote, ConnectWithoutContact, BarChart
} from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints';

const DRAWER_WIDTH = 270;
const DRAWER_COLLAPSED = 72;
const ORANGE = '#E8700A';
const BROWN = '#8B3A0E';

const NAV_GROUPS = [
  {
    items: [
      { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    ]
  },
  {
    title: 'Inbound Planning',
    items: [
      { label: 'Arrival Schedule', icon: <CalendarMonth />, path: '/arrival-schedule' },
      { label: 'Warehouse Approvals', icon: <FactCheck />, path: '/warehouse-approvals' },
    ]
  },
  {
    title: 'Dock Operations',
    items: [
      { label: 'Inbound Yard', icon: <Radar />, path: '/inbound-yard' },
      { label: 'Dock Board', icon: <Anchor />, path: '/dock-board' },
      { label: 'Dock Reservations', icon: <BookOnline />, path: '/dock-reservations' },
    ]
  },
  {
    title: 'Receiving Operations',
    items: [
      { label: 'Gate Check-In', icon: <MeetingRoom />, path: '/gate-checkin' },
      { label: 'Receiving Checklist', icon: <ChecklistRtl />, path: '/receiving-checklist' },
      { label: 'Exceptions', icon: <Warning />, path: '/exceptions' },
      { label: 'Shipment Conversations', icon: <Forum />, path: '/conversations' },
    ]
  },
  {
    title: 'Storage Operations',
    items: [
      { label: 'Warehouse Slotting', icon: <ViewInAr />, path: '/digital-twin', featured: true },
      { label: 'Inventory Placement', icon: <Place />, path: '/inventory-placement' },
      { label: 'Parcel Locator', icon: <Search />, path: '/parcel-locator' },
    ]
  },
  {
    title: 'Forwarding Operations',
    items: [
      { label: 'Forwarding Queue', icon: <QueuePlayNext />, path: '/forwarding-queue' },
      { label: 'Outbound Planning', icon: <EventNote />, path: '/outbound-planning' },
      { label: 'Next Warehouse Coordination', icon: <ConnectWithoutContact />, path: '/next-warehouse' },
    ]
  },
  {
    title: 'Performance',
    items: [
      { label: 'SLA Ledger', icon: <Gavel />, path: '/sla-ledger' },
      { label: 'Warehouse Analytics', icon: <BarChart />, path: '/analytics' },
    ]
  },
  {
    title: 'Notifications',
    items: [
      { label: 'Notifications', icon: <Notifications />, path: '/notifications' },
    ]
  }
];

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.data?.data?.unread_count ?? 0;

  const currentLabel = NAV_GROUPS.flatMap(g => g.items).find(n => location.pathname.startsWith(n.path))?.label || 'Dashboard';

  const drawerContent = (
    <Box sx={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'linear-gradient(180deg, #FFFCF9 0%, #FFF8F2 100%)',
      color: '#0F172A',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative gradient orb */}
      <Box sx={{
        position: 'absolute', top: -40, right: -40, width: 120, height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(ORANGE, 0.08)} 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '12px',
          background: `linear-gradient(135deg, ${ORANGE} 0%, ${BROWN} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 18, color: '#fff',
          boxShadow: `0 4px 14px ${alpha(ORANGE, 0.3)}`,
          flexShrink: 0,
        }}>
          M
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{
            fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2,
            background: `linear-gradient(135deg, ${BROWN} 0%, ${ORANGE} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Marg
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', letterSpacing: '0.04em' }}>
            {user?.organization_name || 'Warehouse Portal'}
          </Typography>
        </Box>
        {!isMobile && (
          <IconButton
            onClick={() => setDrawerOpen(false)}
            size="small"
            sx={{ ml: 'auto', color: '#94A3B8', '&:hover': { color: ORANGE } }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: alpha(ORANGE, 0.06), mx: 2 }} />

      {/* Nav items */}
      <List sx={{ px: 1.5, flex: 1, pt: 2, display: 'flex', flexDirection: 'column', gap: 0.3, overflowY: 'auto' }}>
        {NAV_GROUPS.map((group, gIndex) => (
          <Box key={gIndex} sx={{ mb: group.title ? 1.5 : 0.5 }}>
            {group.title && (
              <Typography sx={{ 
                px: 1.5, pb: 0.5, pt: 1,
                fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', 
                textTransform: 'uppercase', letterSpacing: '0.05em' 
              }}>
                {group.title}
              </Typography>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <ListItemButton
                  key={item.path}
                  onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
                  sx={{
                    borderRadius: '14px',
                    py: 1.1,
                    px: 1.5,
                    mb: 0.3,
                    position: 'relative',
                    bgcolor: isActive ? alpha(ORANGE, 0.1) : 'transparent',
                    color: isActive ? ORANGE : '#64748B',
                    '&:hover': {
                      bgcolor: alpha(ORANGE, 0.06),
                      color: ORANGE,
                    },
                    transition: 'all 0.2s ease',
                    ...((item as any).featured && !isActive && {
                      background: `linear-gradient(135deg, ${alpha(ORANGE, 0.05)} 0%, ${alpha(BROWN, 0.03)} 100%)`,
                      border: `1px solid ${alpha(ORANGE, 0.1)}`,
                    }),
                    ...(isActive && {
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3,
                        height: '60%',
                        borderRadius: '0 4px 4px 0',
                        background: `linear-gradient(180deg, ${ORANGE} 0%, ${BROWN} 100%)`,
                      },
                    }),
                  }}
                >
                  <ListItemIcon sx={{
                    color: 'inherit', minWidth: 36,
                    '& .MuiSvgIcon-root': { fontSize: (item as any).featured ? '1.35rem' : '1.25rem' },
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.83rem',
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: '-0.01em',
                    }}
                  />
                  {isActive && (
                    <Box sx={{
                      width: 6, height: 6, borderRadius: '50%',
                      bgcolor: ORANGE,
                      boxShadow: `0 0 8px ${alpha(ORANGE, 0.5)}`,
                    }} />
                  )}
                </ListItemButton>
              );
            })}
          </Box>
        ))}
      </List>

      {/* User */}
      <Divider sx={{ borderColor: alpha(ORANGE, 0.06), mx: 2 }} />
      <Box sx={{
        p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
        m: 1.5, borderRadius: '14px',
        bgcolor: alpha(ORANGE, 0.04),
        border: `1px solid ${alpha(ORANGE, 0.06)}`,
      }}>
        <Avatar sx={{
          width: 36, height: 36,
          background: `linear-gradient(135deg, ${ORANGE} 0%, ${BROWN} 100%)`,
          fontSize: '0.85rem', fontWeight: 700,
          boxShadow: `0 2px 8px ${alpha(ORANGE, 0.25)}`,
        }}>
          {user?.full_name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{
            color: '#0F172A', fontWeight: 600, fontSize: '0.8rem',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.full_name}
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem' }}>
            {user?.role?.replace(/_/g, ' ')}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton
            size="small"
            onClick={logout}
            sx={{
              color: '#94A3B8',
              '&:hover': { color: '#EF4444', bgcolor: alpha('#EF4444', 0.08) },
            }}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#FBF9F7' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: DRAWER_WIDTH, flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            border: 'none',
            boxShadow: '2px 0 24px rgba(139, 58, 14, 0.04)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: isMobile ? '100%' : `calc(100% - ${drawerOpen ? DRAWER_WIDTH : 0}px)`,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 0,
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: alpha('#FFFCF9', 0.85),
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${alpha(ORANGE, 0.06)}`,
          }}
        >
          <Toolbar sx={{ gap: 2, minHeight: '64px !important' }}>
            {(isMobile || !drawerOpen) && (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#0F172A' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 700, fontSize: '1.15rem' }}>
                {currentLabel}
              </Typography>
            </Box>
            <Tooltip title="Notifications">
              <IconButton sx={{
                color: '#64748B',
                '&:hover': { color: ORANGE, bgcolor: alpha(ORANGE, 0.06) },
              }}>
                <Badge
                  badgeContent={unreadCount}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: ORANGE,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                    },
                  }}
                >
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>
            <Avatar sx={{
              width: 36, height: 36,
              background: `linear-gradient(135deg, ${ORANGE} 0%, ${BROWN} 100%)`,
              fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer',
              border: `2px solid ${alpha(ORANGE, 0.2)}`,
            }}>
              {user?.full_name?.charAt(0) || 'U'}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box sx={{
          flex: 1,
          p: { xs: 2, md: 3 },
          overflow: 'auto',
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
