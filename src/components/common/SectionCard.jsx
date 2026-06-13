import { useId } from 'react'
import { Paper, Stack, Typography } from '@mui/material'

const baseCardSx = {
  p: { xs: 2.5, md: 3.5 },
  borderRadius: 4,
  border: '1px solid rgba(15, 23, 42, 0.08)',
  boxShadow: '0 18px 60px rgba(15, 23, 42, 0.06)',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(249, 251, 255, 0.98) 100%)',
}

function SectionCard({ title, description, children, sx, ...paperProps }) {
  const titleId = useId()
  const mergedSx = [baseCardSx]

  if (Array.isArray(sx)) {
    mergedSx.push(...sx)
  } else if (sx) {
    mergedSx.push(sx)
  }

  return (
    <Paper {...paperProps} component="section" aria-labelledby={title ? titleId : undefined} elevation={0} sx={mergedSx}>
      <Stack spacing={2.5}>
        {(title || description) && (
          <Stack spacing={0.5}>
            {title ? (
              <Typography variant="h2" component="h2" id={titleId}>
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            ) : null}
          </Stack>
        )}
        {children}
      </Stack>
    </Paper>
  )
}

export default SectionCard
