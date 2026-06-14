import { createTheme, alpha } from '@mui/material/styles';

const ORANGE = '#F97316';
const ORANGE_DARK = '#EA580C';
const ORANGE_LIGHT = '#FFF7ED';
const DARK = '#18181B';
const GRAY = '#6B7280';

const theme = createTheme({
  palette: {
    primary: {
      main: ORANGE,
      dark: ORANGE_DARK,
      light: '#FB923C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: DARK,
      light: '#3F3F46',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FDFBF7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: GRAY,
    },
    success: { main: '#22C55E' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    info: { main: '#3B82F6' },
    divider: alpha('#000', 0.06),
  },
  typography: {
    fontFamily: '"Poppins", "Inter", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.02em', color: '#332922' },
    h5: { fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.01em', color: '#332922' },
    h6: { fontWeight: 700, fontSize: '1.15rem', color: '#332922' },
    subtitle1: { fontWeight: 600, fontSize: '1rem', color: '#332922' },
    subtitle2: { fontWeight: 600, fontSize: '0.85rem', color: '#8A7F75' },
    body2: { fontSize: '0.85rem', color: '#8A7F75' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 24 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${ORANGE_DARK} 0%, #C2410C 100%)`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: 'none',
          boxShadow: '0 12px 40px rgba(214, 204, 194, 0.4)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          '&:hover': {
            boxShadow: '0 16px 50px rgba(214, 204, 194, 0.6)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { 
          borderRadius: 24,
          boxShadow: '0 12px 40px rgba(214, 204, 194, 0.4)', 
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8, fontSize: '0.75rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, color: GRAY, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
        root: { borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '14px 16px' },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
      },
    },
  },
});

export default theme;
