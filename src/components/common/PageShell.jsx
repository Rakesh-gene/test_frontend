import { Box, Container, Stack, Typography } from '@mui/material'

function PageShell({ eyebrow, title, description, actions, children, maxWidth = 'lg' }) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: 'calc(100svh - (2 * var(--app-shell-padding, 0px)))',
        py: { xs: 1.5, md: 2.5 },
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <Container
        maxWidth={maxWidth}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2.5, md: 3 },
          width: '100%',
        }}
      >
        {(eyebrow || title || description || actions) && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack spacing={0.75} sx={{ maxWidth: 720 }}>
              {eyebrow ? (
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.4 }}>
                  {eyebrow}
                </Typography>
              ) : null}
              {title ? (
                <Typography
                  variant="h1"
                  component="h1"
                  sx={{
                    maxWidth: { xs: '14ch', sm: '16ch', md: '14ch' },
                    fontSize: { xs: '2.5rem', sm: '3.25rem', md: '3.75rem' },
                    lineHeight: 1.02,
                  }}
                >
                  {title}
                </Typography>
              ) : null}
              {description ? (
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '58ch' }}>
                  {description}
                </Typography>
              ) : null}
            </Stack>
            {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
          </Stack>
        )}

        {children}
      </Container>
    </Box>
  )
}

export default PageShell
