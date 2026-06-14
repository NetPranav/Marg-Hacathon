import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, Typography, Paper, TextField, IconButton, 
  Avatar, Card, CardContent, Divider, Button, Chip, CircularProgress
} from '@mui/material';
import { Send as SendIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { logisticsApi } from '../api/endpoints';

export default function LogisticsChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [text, setText] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const fetchRoom = () => {
    if (!id) return;
    logisticsApi.getChatRoom(Number(id)).then(res => {
      setRoom(res.data);
      logisticsApi.markReadChat(Number(id)).catch(() => {});
    }).catch(console.error);
  };

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 5000); // Simple polling
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room]);

  const handleSend = async () => {
    if (!text.trim() || !id) return;
    try {
      await logisticsApi.sendMessage({ room: Number(id), text });
      setText('');
      fetchRoom();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptQuote = async (quoteId: number) => {
    try {
      const res = await logisticsApi.acceptQuote(quoteId);
      alert(res.data.message);
      navigate(`/shipments/${res.data.shipment_id}`);
    } catch (e) {
      console.error(e);
      alert("Error accepting quote.");
    }
  };

  if (!room) return <Box p={5} display="flex" justifyContent="center"><CircularProgress /></Box>;

  return (
    <Box height="calc(100vh - 100px)" display="flex" flexDirection="column">
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          {room.logistics_company_name?.charAt(0)}
        </Avatar>
        <Box flexGrow={1}>
          <Typography variant="h6" lineHeight={1.2}>{room.logistics_company_name}</Typography>
          <Typography variant="caption" color="text.secondary">Negotiating Lot: {room.lot_number}</Typography>
        </Box>
        <Chip label="Active Negotiation" color="success" size="small" />
      </Paper>

      {/* Chat Area */}
      <Paper sx={{ flexGrow: 1, p: 2, mb: 2, overflowY: 'auto', bgcolor: '#f5f7f9' }}>
        {room.messages?.map((msg: any) => (
          <Box 
            key={msg.id} 
            display="flex" 
            justifyContent={msg.is_from_logistics ? 'flex-start' : 'flex-end'}
            mb={2}
          >
            <Box 
              sx={{ 
                maxWidth: '70%', 
                bgcolor: msg.is_from_logistics ? 'white' : 'primary.main',
                color: msg.is_from_logistics ? 'text.primary' : 'white',
                p: 2, 
                borderRadius: 2,
                boxShadow: 1
              }}
            >
              <Typography variant="body1">{msg.text}</Typography>
                <Typography variant="caption" display="block" textAlign={msg.is_factory ? 'right' : 'left'} mt={0.5} sx={{ opacity: 0.7 }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
            </Box>
          </Box>
        ))}

        {/* Render Quotes as special cards in the flow */}
        {room.quotes?.map((quote: any) => (
          <Box key={`quote-${quote.id}`} display="flex" justifyContent="center" mb={3} mt={2}>
            <Card sx={{ minWidth: 300, border: '2px solid', borderColor: quote.status === 'ACCEPTED' ? 'success.main' : 'primary.main' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" color="text.secondary">OFFICIAL QUOTE</Typography>
                  <Chip size="small" label={quote.status} color={quote.status === 'ACCEPTED' ? 'success' : 'default'} />
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="h4" fontWeight="bold" textAlign="center" color="primary.main" mb={1}>
                  {quote.currency} {quote.price}
                </Typography>
                <Typography variant="body2" textAlign="center" color="text.secondary" mb={2}>
                  Estimated Transit: {quote.estimated_delivery_hours} hours
                </Typography>
                {quote.status === 'PENDING' && (
                  <Button 
                    variant="contained" 
                    color="success" 
                    fullWidth 
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleAcceptQuote(quote.id)}
                  >
                    Accept Quote & Dispatch
                  </Button>
                )}
              </CardContent>
            </Card>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Paper>

      {/* Input Area */}
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          size="small"
        />
        <IconButton color="primary" onClick={handleSend} disabled={!text.trim()}>
          <SendIcon />
        </IconButton>
      </Paper>
    </Box>
  );
}
