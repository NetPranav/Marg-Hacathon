import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Avatar, Badge, Tooltip,
  useMediaQuery, useTheme, Divider, Collapse,
} from '@mui/material';
import {
  Dashboard, LocalShipping, Map, Person,
  Notifications, Analytics, Menu as MenuIcon, Logout, Add,
  Assignment, Storefront, ExpandMore, ExpandLess,
  FactCheck, Inventory2, Warehouse, HourglassTop,
  Forum, RequestQuote, ChecklistRtl, DoneAll,
  History, BarChart, PlaylistAddCheck, CalendarMonth,
  Warning, TrackChanges, AssignmentTurnedIn, LocalPolice, Settings, People
} from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints';

const DRAWER_WIDTH = 270;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    ],
  },
  {
    title: 'Dispatch Planning',
    items: [
      { label: 'Lots', icon: <Assignment />, path: '/lots' },
      { label: 'Verification Queue', icon: <FactCheck />, path: '/verification-queue' },
      { label: 'Draft Shipments', icon: <Inventory2 />, path: '/draft-shipments' },
      { label: 'Dispatch Calendar', icon: <CalendarMonth />, path: '/dispatch-calendar' },
    ],
  },
  {
    title: 'Warehouse Coordination',
    items: [
      { label: 'Warehouse Requests', icon: <Warehouse />, path: '/warehouse-requests' },
      { label: 'Pending Approvals', icon: <HourglassTop />, path: '/pending-approvals' },
    ],
  },
  {
    title: 'Logistics Coordination',
    items: [
      { label: 'Logistics Partners', icon: <Storefront />, path: '/logistics' },
      { label: 'Conversations', icon: <Forum />, path: '/conversations' },
      { label: 'Quotations', icon: <RequestQuote />, path: '/quotations' },
    ],
  },
  {
    title: 'Dispatch Execution',
    items: [
      { label: 'Shipment Readiness', icon: <AssignmentTurnedIn />, path: '/shipment-readiness' },
      { label: 'Exceptions', icon: <Warning />, path: '/exceptions' },
    ],
  },
  {
    title: 'Shipment Operations',
    items: [
      { label: 'Active Shipments', icon: <LocalShipping />, path: '/shipments' },
      { label: 'Live Tracking', icon: <Map />, path: '/tracking' },
      { label: 'Completed Shipments', icon: <DoneAll />, path: '/completed-shipments' },
      { label: 'Lot Traceability', icon: <TrackChanges />, path: '/lot-traceability' },
    ],
  },
  {
    title: 'Analytics & Reports',
    items: [
      { label: 'Performance Reports', icon: <BarChart />, path: '/analytics' },
      { label: 'Historical Shipments', icon: <History />, path: '/historical-shipments' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { label: 'Employees', icon: <People />, path: '/employees' },
      { label: 'Settings', icon: <Settings />, path: '/settings' },
    ],
  },
  {
    title: '',
    items: [
      { label: 'Notifications', icon: <Notifications />, path: '/notifications' },
    ],
  },
];

// Flatten all items for header label lookup
const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap(s => s.items);

export default function AppLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Track which sections are collapsed
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.data?.data?.unread_count ?? 0;

  const currentLabel = ALL_NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label || 'Dashboard';

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'transparent', color: '#332922', overflow: 'hidden' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 42, height: 42, borderRadius: '14px',
          background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 20, color: '#fff',
        }}>
          M
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ color: '#332922', fontWeight: 800, lineHeight: 1.2, fontSize: '1.1rem' }}>
            Marg Factory
          </Typography>
          <Typography variant="caption" sx={{ color: '#8A7F75', fontSize: '0.75rem', fontWeight: 500 }}>
            Operations Hub
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', mx: 2 }} />

      {/* Quick action */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <ListItemButton
          onClick={() => navigate('/lots/new')}
          sx={{
            borderRadius: '10px', py: 1,
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            color: '#fff',
            '&:hover': { background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)' },
          }}
        >
          <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}><Add /></ListItemIcon>
          <ListItemText primary="New Lot" primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem' }} />
        </ListItemButton>
      </Box>

      {/* Nav sections */}
      <Box sx={{
        flex: 1, pt: 1, overflowY: 'auto',
        '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none'
      }}>
        {NAV_SECTIONS.filter(section => {
          if (section.title === 'Organization') {
            return user?.role === 'SUPER_ADMIN' || user?.role === 'FACTORY_MANAGER';
          }
          return true;
        }).map((section, sIdx) => {
          const isCollapsed = collapsedSections[section.title] ?? false;
          const hasTitle = section.title !== '';

          return (
            <Box key={sIdx} sx={{ mb: 0.5 }}>
              {/* Section Header */}
              {hasTitle && (
                <ListItemButton
                  onClick={() => toggleSection(section.title)}
                  sx={{
                    mx: 2, borderRadius: '8px', py: 0.5, px: 1.5, mb: 0.5, mt: 1,
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                  }}
                >
                  <Typography sx={{
                    flex: 1, fontSize: '0.65rem', fontWeight: 800,
                    color: '#B0A89E', letterSpacing: '1.2px', textTransform: 'uppercase',
                  }}>
                    {section.title}
                  </Typography>
                  {isCollapsed ? <ExpandMore sx={{ fontSize: 16, color: '#B0A89E' }} /> : <ExpandLess sx={{ fontSize: 16, color: '#B0A89E' }} />}
                </ListItemButton>
              )}

              {/* Section Items */}
              <Collapse in={!isCollapsed} timeout="auto">
                <List disablePadding sx={{ px: 2 }}>
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path || 
                      (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                    return (
                      <ListItemButton
                        key={item.path}
                        onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
                        sx={{
                          borderRadius: '12px', mb: 0.3, py: 0.8, px: 1.5,
                          bgcolor: isActive ? '#FFF' : 'transparent',
                          boxShadow: isActive ? '0 4px 20px rgba(214, 204, 194, 0.4)' : 'none',
                          color: isActive ? '#332922' : '#8A7F75',
                          '&:hover': { bgcolor: isActive ? '#FFF' : 'rgba(0,0,0,0.02)', color: '#332922' },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ListItemIcon sx={{ color: isActive ? '#F97316' : 'inherit', minWidth: 34, '& .MuiSvgIcon-root': { fontSize: '1.2rem' } }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 500 }}
                        />
                        {isActive && (
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#EA580C', ml: 'auto' }} />
                        )}
                        {item.label === 'Notifications' && unreadCount > 0 && (
                          <Badge badgeContent={unreadCount} color="error" sx={{ mr: 1 }} />
                        )}
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </Box>

      {/* User */}
      <Box sx={{ p: 2 }}>
        <Box sx={{
          p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5,
          bgcolor: '#FFF', borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(214, 204, 194, 0.4)'
        }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#C2410C', fontSize: '0.85rem', fontWeight: 700 }}>
            {user?.full_name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: '#332922', fontWeight: 700, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8A7F75', fontSize: '0.65rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {user?.role?.replace(/_/g, ' ')}
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={logout} sx={{ color: '#8A7F75', '&:hover': { color: '#EA580C' } }}>
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#FDFBF7' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: DRAWER_WIDTH, flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', background: 'transparent' },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin 0.3s' }}>
        {/* Header */}
        <AppBar position="sticky" elevation={0} sx={{ background: 'transparent', pt: 2, px: { xs: 2, md: 3 } }}>
          <Toolbar sx={{ gap: 2, minHeight: '64px !important', px: '0 !important' }}>
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#332922' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h5" sx={{ flex: 1, color: '#332922', fontWeight: 800 }}>
              {currentLabel}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Notifications">
                <IconButton onClick={() => navigate('/notifications')} sx={{ bgcolor: '#FFF', boxShadow: '0 8px 20px rgba(214, 204, 194, 0.4)', '&:hover': { bgcolor: '#FFF' } }}>
                  <Badge badgeContent={unreadCount} color="error">
                    <Notifications sx={{ color: '#8A7F75' }} />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Avatar sx={{ bgcolor: '#C2410C', fontWeight: 700, boxShadow: '0 8px 20px rgba(214, 204, 194, 0.4)' }}>
                {user?.full_name?.charAt(0) || 'U'}
              </Avatar>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
