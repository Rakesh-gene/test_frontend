import { createTheme } from '@mui/material/styles'

const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2f5cff',
      dark: '#2044c9',
      light: '#6d8cff',
    },
    secondary: {
      main: '#8a4fff',
    },
    background: {
      default: '#f4f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily:
      '"Avenir Next", "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at top, rgba(47, 92, 255, 0.12), transparent 32%), linear-gradient(180deg, #f8fbff 0%, #eef3fb 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
})

export default appTheme
