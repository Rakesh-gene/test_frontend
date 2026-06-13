import { CircularProgress, Button } from '@mui/material'

/**
 * Primary button for form submission actions.
 */
function PrimaryActionButton({
  children,
  loading = false,
  disabled = false,
  type = 'submit',
  fullWidth = true,
  sx,
}) {
  return (
    <Button
      type={type}
      variant="contained"
      color="primary"
      size="large"
      fullWidth={fullWidth}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      sx={[
        {
          minHeight: 52,
          borderRadius: 999,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {loading ? <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} /> : null}
      {children}
    </Button>
  )
}

export default PrimaryActionButton
