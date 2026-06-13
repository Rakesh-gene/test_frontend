import { Button } from '@mui/material'

const baseButtonSx = {
  borderRadius: 999,
  px: 3,
  py: 1.25,
  minHeight: 52,
  boxShadow: '0 12px 24px rgba(47, 92, 255, 0.22)',
  '&:hover': {
    boxShadow: '0 16px 28px rgba(47, 92, 255, 0.28)',
  },
}

function PrimaryActionButton({ sx, children, ...buttonProps }) {
  const mergedSx = [baseButtonSx]

  if (Array.isArray(sx)) {
    mergedSx.push(...sx)
  } else if (sx) {
    mergedSx.push(sx)
  }

  return (
    <Button {...buttonProps} variant="contained" size="large" disableElevation sx={mergedSx}>
      {children}
    </Button>
  )
}

export default PrimaryActionButton

