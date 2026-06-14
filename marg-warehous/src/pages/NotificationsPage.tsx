import { Box, Typography } from '@mui/material';

export default function NotificationsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>Notifications Center</Typography>
      <Typography color="text.secondary">All system alerts, chat notifications, and SLA warnings (Under Construction).</Typography>
    </Box>
  );
}
