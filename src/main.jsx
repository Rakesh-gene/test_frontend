import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import './index.css'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f4c5c',
      dark: '#08313d',
      light: '#2f7c8a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c36f27',
      light: '#e79b5d',
    },
    background: {
      default: '#f4efe8',
      paper: '#fffaf4',
    },
    text: {
      primary: '#16313a',
      secondary: '#5b6b72',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
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
            'radial-gradient(circle at top left, rgba(15, 76, 92, 0.16), transparent 38%), radial-gradient(circle at top right, rgba(195, 111, 39, 0.14), transparent 34%), #f4efe8',
        },
        a: {
          color: 'inherit',
          textDecoration: 'none',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
