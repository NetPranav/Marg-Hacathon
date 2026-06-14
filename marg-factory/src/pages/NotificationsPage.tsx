import React from 'react';
import {
  Box, Card, CardContent, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, Button, Chip, Divider,
} from '@mui/material';
import {
  LocalShipping, Warning, CheckCircle, Dock, SwapHoriz,
  MarkEmailRead, DoneAll,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/endpoints';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  SHIPMENT: <LocalShipping sx={{ color: '#F97316' }} />,
  DOCK: <Dock sx={{ color: '#3B82F6' }} />,
  ALERT: <Warning sx={{ color: '#EF4444' }} />,
  ASSIGNMENT: <SwapHoriz sx={{ color: '#8B5CF6' }} />,
  RETURN_LOAD: <SwapHoriz sx={{ color: '#22C55E' }} />,
  SYSTEM: <CheckCircle sx={{ color: '#6B7280' }} />,
  GEOFENCE: <Warning sx={{ color: '#F59E0B' }} />,
  TELEMETRY: <LocalShipping sx={{ color: '#3B82F6' }} />,
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const notifications = data?.data?.results ?? [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Notifications</Typography>
        <Button startIcon={<DoneAll />} onClick={() => markAllRead.mutate()} size="small" sx={{ color: '#F97316' }}>
          Mark All Read
        </Button>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <List>
            {notifications.map((n: any, i: number) => (
              <React.Fragment key={n.id}>
                <ListItemButton
                  onClick={() => !n.is_read && markRead.mutate(n.id)}
                  sx={{
                    bgcolor: n.is_read ? 'transparent' : 'rgba(249,115,22,0.03)',
                    py: 2,
                  }}
                >
                  <ListItemIcon>
                    {TYPE_ICONS[n.notification_type] || TYPE_ICONS.SYSTEM}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: n.is_read ? 400 : 700, color: '#18181B' }}>
                          {n.title}
                        </Typography>
                        {!n.is_read && <Chip label="New" size="small" sx={{ bgcolor: '#FFF7ED', color: '#F97316', height: 20, fontSize: '0.65rem' }} />}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.3 }}>{n.message}</Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 0.5, display: 'block' }}>
                          {new Date(n.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
                {i < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            {notifications.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <MarkEmailRead sx={{ fontSize: 48, color: '#D4D4D8', mb: 1 }} />
                <Typography variant="body2" sx={{ color: '#9CA3AF' }}>All caught up!</Typography>
              </Box>
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
