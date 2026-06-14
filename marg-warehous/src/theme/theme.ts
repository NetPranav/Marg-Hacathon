import { createTheme, alpha } from '@mui/material/styles';

// ── Design Tokens — Warm Orange / Dark Navy ──────────────────────
const ORANGE = '#E8700A';
const ORANGE_LIGHT = '#F59E0B';
const ORANGE_DARK = '#CC5F00';
const BROWN = '#8B3A0E';
const BROWN_DARK = '#6D2D09';
const NAVY = '#0F172A';
const NAVY_LIGHT = '#1E293B';
const SLATE = '#64748B';
const SLATE_LIGHT = '#94A3B8';
const BG_WARM = '#FBF9F7';
const BG_CARD = '#FFFFFF';

const theme = createTheme({
  palette: {
    primary: {
      main: ORANGE,
      dark: ORANGE_DARK,
      light: ORANGE_LIGHT,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: BROWN,
      light: '#A0522D',
      dark: BROWN_DARK,
      contrastText: '#FFFFFF',
    },
    background: {
      default: BG_WARM,
      paper: BG_CARD,
    },
    text: {
      primary: NAVY,
      secondary: SLATE,
    },
    success: { main: '#22C55E', light: '#86EFAC', dark: '#16A34A' },
    warning: { main: '#F59E0B', light: '#FCD34D', dark: '#D97706' },
    error: { main: '#EF4444', light: '#FCA5A5', dark: '#DC2626' },
    info: { main: '#3B82F6', light: '#93C5FD', dark: '#2563EB' },
    divider: alpha('#000', 0.05),
  },

  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 800,
      fontSize: '2rem',
      letterSpacing: '-0.03em',
      color: NAVY,
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 800,
      fontSize: '1.75rem',
      letterSpacing: '-0.02em',
      color: NAVY,
      lineHeight: 1.25,
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.35rem',
      letterSpacing: '-0.01em',
      color: NAVY,
    },
    h6: {
      fontWeight: 700,
      fontSize: '1.1rem',
      color: NAVY,
    },
    subtitle1: {
      fontWeight: 600,
      fontSize: '0.95rem',
      color: NAVY,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.85rem',
      color: SLATE,
    },
    body1: {
      fontSize: '0.9rem',
      color: NAVY,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.85rem',
      color: SLATE,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      color: SLATE_LIGHT,
      fontWeight: 500,
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },

  shape: { borderRadius: 16 },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: '0.875rem',
          boxShadow: 'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { boxShadow: 'none', transform: 'translateY(-1px)' },
          '&:active': { transform: 'translateY(0)' },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${ORANGE} 0%, ${ORANGE_DARK} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${ORANGE_DARK} 0%, #A04D00 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${BROWN} 0%, ${BROWN_DARK} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${BROWN_DARK} 0%, #5A2307 100%)`,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid rgba(0, 0, 0, 0.04)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.03)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(139, 58, 14, 0.06), 0 12px 32px rgba(0,0,0,0.04)',
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 20 },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 10,
          fontSize: '0.75rem',
          height: 28,
          letterSpacing: '0.02em',
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: SLATE,
          fontSize: '0.75rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.08em',
          borderBottom: `2px solid ${alpha(ORANGE, 0.08)}`,
        },
        root: {
          borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
          padding: '14px 16px',
          fontSize: '0.85rem',
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(ORANGE, 0.4),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: ORANGE,
              borderWidth: '1.5px',
            },
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 24 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: NAVY,
          borderRadius: 10,
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 12px',
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 6,
          backgroundColor: alpha(ORANGE, 0.08),
        },
        bar: {
          borderRadius: 8,
          background: `linear-gradient(90deg, ${ORANGE} 0%, ${ORANGE_LIGHT} 100%)`,
        },
      },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: `linear-gradient(90deg, ${alpha(ORANGE, 0.04)} 25%, ${alpha(ORANGE, 0.08)} 50%, ${alpha(ORANGE, 0.04)} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
        },
      },
    },
  },
});

export default theme;
