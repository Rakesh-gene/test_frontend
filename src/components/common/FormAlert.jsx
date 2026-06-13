import { Alert, AlertTitle } from '@mui/material'

/**
 * Alert/banner state for form feedback.
 */
function FormAlert({ severity = 'info', title, children, onClose, action, sx }) {
  return (
    <Alert severity={severity} onClose={onClose} action={action} sx={sx}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {children}
    </Alert>
  )
}

export default FormAlert
