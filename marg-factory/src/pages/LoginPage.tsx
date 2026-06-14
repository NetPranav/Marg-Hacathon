import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, InputAdornment,
  IconButton, Alert, CircularProgress, Checkbox, FormControlLabel,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { user: u, access, refresh } = res.data;
      login(u, access, refresh);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #18181B 0%, #27272A 50%, #18181B 100%)',
      p: 2,
    }}>
      {/* Decorative elements */}
      <Box sx={{
        position: 'absolute', top: '10%', right: '15%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '15%', left: '10%',
        width: 250, height: 250, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      <Card sx={{
        width: '100%', maxWidth: 420, p: 4, borderRadius: '24px',
        bgcolor: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '16px', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff',
            boxShadow: '0 8px 24px rgba(249,115,22,0.3)',
          }}>
            L
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#18181B', mb: 0.5 }}>
            Marg
          </Typography>
          <Typography variant="body2" sx={{ color: '#6B7280' }}>
            Factory Operations Portal
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email Address" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Email sx={{ color: '#9CA3AF' }} /></InputAdornment>,
            }}
          />
          <TextField
            fullWidth label="Password" type={showPassword ? 'text' : 'password'}
            value={password} onChange={(e) => setPassword(e.target.value)} required
            sx={{ mb: 1.5 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#9CA3AF' }} /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <FormControlLabel
              control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} size="small" />}
              label={<Typography variant="body2">Remember me</Typography>}
            />
          </Box>

          <Button
            type="submit" fullWidth variant="contained" size="large" disabled={loading}
            sx={{
              py: 1.5, fontSize: '0.95rem', fontWeight: 700, borderRadius: '12px',
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
                boxShadow: '0 6px 20px rgba(249,115,22,0.4)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
          </Button>
        </form>

          <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: '#6B7280' }}>
            Don't have a factory?{' '}
            <Button variant="text" onClick={() => navigate('/register-factory')} sx={{ p: 0, minWidth: 0, textTransform: 'none', fontWeight: 700, color: '#EA580C', '&:hover': { background: 'transparent', textDecoration: 'underline' } }}>
              Register here
            </Button>
          </Typography>

        <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: '#9CA3AF', fontSize: '0.75rem' }}>
          Marg — Intelligent Logistics Orchestration
        </Typography>
      </Card>
    </Box>
  );
}
