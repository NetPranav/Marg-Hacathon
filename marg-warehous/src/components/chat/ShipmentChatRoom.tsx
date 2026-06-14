import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, IconButton, Paper, Avatar, alpha, CircularProgress } from '@mui/material';
import { Send, Image as ImageIcon, AttachFile } from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';

interface Message {
  id: number;
  content: string;
  sender_name?: string;
  sender_role?: string;
  message_type: 'TEXT' | 'SYSTEM' | 'IMAGE' | 'DOCUMENT';
  created_at: string;
}

export default function ShipmentChatRoom({ shipmentId }: { shipmentId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Mock initial load (should be replaced with actual API call)
  useEffect(() => {
    // In a real app, we'd fetch the thread_id for this shipment, then connect to WS
    // mock messages
    setTimeout(() => {
      setMessages([
        { id: 1, content: 'Shipment created and driver assigned.', message_type: 'SYSTEM', created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
      setLoading(false);
    }, 500);

    // Mock WebSocket connection
    // wsRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${thread_id}/`);
    // wsRef.current.onmessage = (e) => {
    //   const data = JSON.parse(e.data);
    //   if (data.type === 'chat_message') {
    //     setMessages(prev => [...prev, data.message]);
    //   }
    // };

    return () => {
      wsRef.current?.close();
    };
  }, [shipmentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Optimistic UI update or send via WebSocket
    const newMsg: Message = {
      id: Date.now(),
      content: input,
      sender_name: user?.full_name || 'Me',
      message_type: 'TEXT',
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    
    // In real app: axios.post('/api/v1/chat/messages/', { thread_id, content: input })
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={24} /></Box>;
  }

  return (
    <Paper sx={{ display: 'flex', flexDirection: 'column', height: 400, borderRadius: 3, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Shipment Coordination: {shipmentId}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>Live Driver & Warehouse Chat</Typography>
      </Box>

      {/* Message List */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#F8FAFC' }}>
        {messages.map((msg) => {
          if (msg.message_type === 'SYSTEM') {
            return (
              <Box key={msg.id} sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                <Typography variant="caption" sx={{ bgcolor: alpha('#94A3B8', 0.1), color: '#64748B', px: 2, py: 0.5, borderRadius: 4, fontWeight: 500 }}>
                  {msg.content}
                </Typography>
              </Box>
            );
          }

          const isMe = msg.sender_name === (user?.full_name || 'Me');
          return (
            <Box key={msg.id} sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && <Typography variant="caption" sx={{ color: '#94A3B8', ml: 1, mb: 0.5 }}>{msg.sender_name}</Typography>}
              <Box sx={{
                bgcolor: isMe ? 'primary.main' : 'white',
                color: isMe ? 'white' : 'text.primary',
                px: 2, py: 1.5,
                borderRadius: 2,
                borderTopRightRadius: isMe ? 0 : undefined,
                borderTopLeftRadius: !isMe ? 0 : undefined,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                maxWidth: '80%'
              }}>
                <Typography variant="body2">{msg.content}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#CBD5E1', mt: 0.5, mr: isMe ? 1 : 0, ml: !isMe ? 1 : 0 }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          );
        })}
        <div ref={bottomRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton size="small" sx={{ color: '#94A3B8' }}><AttachFile /></IconButton>
        <IconButton size="small" sx={{ color: '#94A3B8' }}><ImageIcon /></IconButton>
        <TextField 
          fullWidth 
          size="small" 
          placeholder="Type a message..." 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#F8FAFC' } }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}>
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
}
