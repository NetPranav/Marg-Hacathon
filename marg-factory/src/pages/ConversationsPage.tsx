import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Chip,
  CircularProgress, TextField, InputAdornment, Badge,
} from '@mui/material';
import { Forum, Search, Circle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { logisticsApi } from '../api/endpoints';

export default function ConversationsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    logisticsApi.listChatRooms()
      .then(res => setRooms(res.data.results || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = rooms.filter(r =>
    (r.logistics_company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.lot_number || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#332922' }}>
            Conversations
          </Typography>
          <Typography variant="body2" sx={{ color: '#8A7F75', mt: 0.5 }}>
            Active negotiations with logistics partners.
          </Typography>
        </Box>
        <TextField
          size="small"
          placeholder="Search conversations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ width: 280 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#B0A89E' }} /></InputAdornment>
          }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Forum sx={{ fontSize: 60, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#8A7F75' }}>No Active Conversations</Typography>
            <Typography variant="body2" sx={{ color: '#B0A89E' }}>
              Start a conversation from the Logistics Partners page.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map(room => {
            const lastMsg = room.messages?.[room.messages.length - 1];
            const hasQuote = (room.quotes || []).some((q: any) => q.status === 'PENDING');
            return (
              <Card
                key={room.id}
                onClick={() => navigate(`/logistics/chat/${room.id}`)}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'translateX(4px)', boxShadow: '0 16px 50px rgba(214, 204, 194, 0.6)' },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: '#F97316', fontWeight: 700, fontSize: '1.1rem' }}>
                    {(room.logistics_company_name || 'L').charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#332922', fontSize: '0.95rem' }}>
                        {room.logistics_company_name || 'Logistics Partner'}
                      </Typography>
                      {hasQuote && (
                        <Chip label="Quote Pending" size="small"
                          sx={{ bgcolor: '#D1FAE5', color: '#059669', fontWeight: 700, borderRadius: '6px', height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: '#8A7F75' }}>
                      Lot: {room.lot_number || 'N/A'}
                    </Typography>
                    {lastMsg && (
                      <Typography variant="body2" sx={{
                        color: '#8A7F75', mt: 0.5, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {lastMsg.is_from_logistics ? '↙ ' : '↗ '}{lastMsg.text}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    {lastMsg && (
                      <Typography variant="caption" sx={{ color: '#B0A89E' }}>
                        {new Date(lastMsg.created_at).toLocaleDateString()}
                      </Typography>
                    )}
                    <Box sx={{ mt: 0.5 }}>
                      <Circle sx={{ fontSize: 8, color: '#22C55E' }} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
