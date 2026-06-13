import { CssBaseline, ThemeProvider } from '@mui/material'
import appTheme from './appTheme'

function AppProviders({ children }) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}

export default AppProviders
