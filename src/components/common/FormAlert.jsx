import { Alert, AlertTitle } from '@mui/material'

/**
 * Alert/banner state for form feedback.
 */
function FormAlert({ id, severity = 'info', title, children, onClose, action, sx }) {
  return (
    <Alert id={id} severity={severity} onClose={onClose} action={action} sx={sx}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      {children}
    </Alert>
  )
}

export default FormAlert
