import { CssBaseline, ThemeProvider } from '@mui/material'
import { render } from '@testing-library/react'
import theme from '../theme.js'

export function renderWithTheme(ui, options) {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {ui}
    </ThemeProvider>,
    options,
  )
}
