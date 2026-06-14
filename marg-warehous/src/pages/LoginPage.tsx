import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, CircularProgress, Alert, InputAdornment, IconButton, alpha,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';

const ORANGE = '#E8700A';
const BROWN = '#8B3A0E';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(email, password);
      const { user, access, refresh } = res.data;
      login(user, access, refresh);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(145deg, #FBF9F7 0%, #FFF5EE 40%, #FBF9F7 100%)',
      p: 3, position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative elements */}
      <Box sx={{
        position: 'absolute', top: '5%', right: '8%', width: 400, height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(ORANGE, 0.06)} 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '10%', left: '5%', width: 300, height: 300,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(BROWN, 0.04)} 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />
      {/* Grid pattern */}
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(${alpha(ORANGE, 0.015)} 1px, transparent 1px),
          linear-gradient(90deg, ${alpha(ORANGE, 0.015)} 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
        pointerEvents: 'none',
      }} />

      <Card sx={{
        p: { xs: 3, sm: 4.5 }, width: '100%', maxWidth: 440, position: 'relative',
        border: `1px solid ${alpha(ORANGE, 0.06)}`,
        boxShadow: `0 8px 40px ${alpha(ORANGE, 0.06)}, 0 2px 8px rgba(0,0,0,0.02)`,
      }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '16px', mx: 'auto', mb: 2,
            background: `linear-gradient(135deg, ${ORANGE} 0%, ${BROWN} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 24,
            boxShadow: `0 8px 24px ${alpha(ORANGE, 0.3)}`,
          }}>
            M
          </Box>
          <Typography sx={{
            fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2,
            background: `linear-gradient(135deg, ${BROWN} 0%, ${ORANGE} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Marg
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: '#94A3B8' }}>
            Sign in to manage warehouse operations
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{
            mb: 2.5, borderRadius: 3,
            border: `1px solid ${alpha('#EF4444', 0.15)}`,
            '& .MuiAlert-icon': { color: '#EF4444' },
          }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" autoComplete="email" sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email sx={{ color: '#CBD5E1', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth label="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'} autoComplete="current-password" sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#CBD5E1', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                    {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth type="submit" variant="contained" size="large" disabled={loading}
            sx={{
              py: 1.5, fontSize: '0.95rem', fontWeight: 700,
              background: `linear-gradient(135deg, ${ORANGE} 0%, ${BROWN} 100%)`,
              boxShadow: `0 4px 16px ${alpha(ORANGE, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${BROWN} 0%, #5A2307 100%)`,
                boxShadow: `0 6px 24px ${alpha(ORANGE, 0.4)}`,
              },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Don't have an account?{' '}
              <Button color="primary" onClick={() => navigate('/register')} sx={{ textTransform: 'none', color: '#E8700A' }}>
                Register your warehouse
              </Button>
            </Typography>
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 3.5, color: '#CBD5E1', fontSize: '0.75rem' }}>
          Marg — Intelligent Warehouse Management
        </Typography>
      </Card>
    </Box>
  );
}
