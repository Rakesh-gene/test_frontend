import { Paper, Stack, Typography } from '@mui/material'

/**
 * Card wrapper for form-centric content.
 *
 * @param {{
 *   eyebrow?: string
 *   title: string
 *   description?: string
 *   children: import('react').ReactNode
 *   footer?: import('react').ReactNode
 *   sx?: import('@mui/material').SxProps
 * }} props
 */
function FormCard({ eyebrow, title, description, children, footer, sx }) {
  return (
    <Paper
      elevation={0}
      sx={[
        {
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          border: '1px solid rgba(15, 76, 92, 0.12)',
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 20px 50px rgba(15, 76, 92, 0.08)',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack spacing={3}>
        <Stack spacing={0.75}>
          {eyebrow ? (
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.6 }}>
              {eyebrow}
            </Typography>
          ) : null}

          <Typography variant="h5" component="h2">
            {title}
          </Typography>

          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Stack>

        {children}

        {footer ? <div>{footer}</div> : null}
      </Stack>
    </Paper>
  )
}

export default FormCard
