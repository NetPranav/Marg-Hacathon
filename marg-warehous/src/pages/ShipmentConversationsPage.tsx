import { Box, Typography, Card, Grid, List, ListItemButton, ListItemAvatar, Avatar, ListItemText, TextField, IconButton, Divider, alpha } from '@mui/material';
import { Send, AttachFile, Factory, LocalShipping, Warehouse, Person } from '@mui/icons-material';

const ORANGE = '#E8700A';

const MOCK_CHATS: any[] = [];
const MOCK_MESSAGES: any[] = [];

export default function ShipmentConversationsPage() {
  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
          Shipment Conversations
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B' }}>
          Collaborate with factories, logistics partners, and drivers in real-time.
        </Typography>
      </Box>

      <Card sx={{ flex: 1, display: 'flex', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box sx={{ width: 300, borderRight: '1px solid rgba(0,0,0,0.05)', bgcolor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <TextField fullWidth placeholder="Search shipments..." size="small" sx={{ bgcolor: '#fff', borderRadius: 1 }} />
          </Box>
          <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
            {MOCK_CHATS.map((chat, idx) => (
              <ListItemButton key={chat.id} selected={idx === 0} sx={{ 
                p: 2, borderBottom: '1px solid rgba(0,0,0,0.03)',
                '&.Mui-selected': { bgcolor: alpha(ORANGE, 0.08) }
              }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: idx === 0 ? ORANGE : '#CBD5E1', color: '#fff' }}>
                    <LocalShipping fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={<Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{chat.title}</Typography>}
                  secondary={<Typography variant="caption" sx={{ color: '#64748B' }}>{chat.subtitle}</Typography>}
                />
                {chat.unread > 0 && (
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                    {chat.unread}
                  </Box>
                )}
              </ListItemButton>
            ))}
          </List>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.1rem' }}>SHP-2023-0801</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#3B82F6', 0.1), color: '#3B82F6' }}><Factory sx={{ fontSize: 16 }}/></Avatar>
              <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(ORANGE, 0.1), color: ORANGE }}><Warehouse sx={{ fontSize: 16 }}/></Avatar>
              <Avatar sx={{ width: 28, height: 28, bgcolor: alpha('#22C55E', 0.1), color: '#22C55E' }}><Person sx={{ fontSize: 16 }}/></Avatar>
            </Box>
          </Box>

          <Box sx={{ flex: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {MOCK_MESSAGES.map((msg, i) => {
              if (msg.role === 'SYSTEM') {
                return (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                    <Typography variant="caption" sx={{ bgcolor: alpha('#94A3B8', 0.1), color: '#64748B', px: 2, py: 0.5, borderRadius: 4, fontWeight: 600 }}>
                      {msg.text} • {msg.time}
                    </Typography>
                  </Box>
                );
              }
              const isMe = msg.role === 'WAREHOUSE';
              return (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <Typography variant="caption" sx={{ color: '#94A3B8', mb: 0.5, ml: isMe ? 0 : 1, mr: isMe ? 1 : 0 }}>
                    {msg.sender} • {msg.time}
                  </Typography>
                  <Box sx={{ 
                    bgcolor: isMe ? ORANGE : '#F1F5F9', 
                    color: isMe ? '#fff' : '#0F172A',
                    p: 1.5, borderRadius: 2, maxWidth: '70%',
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                  }}>
                    <Typography variant="body2">{msg.text}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Divider />
          <Box sx={{ p: 2, bgcolor: '#F8FAFC', display: 'flex', gap: 1 }}>
            <IconButton sx={{ color: '#94A3B8' }}><AttachFile /></IconButton>
            <TextField fullWidth placeholder="Type a message..." size="small" sx={{ bgcolor: '#fff' }} />
            <IconButton sx={{ color: ORANGE, bgcolor: alpha(ORANGE, 0.1) }}><Send /></IconButton>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
