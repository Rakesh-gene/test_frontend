import { forwardRef } from 'react'
import { TextField } from '@mui/material'
import { fieldRootSx } from './fieldStyles'

const FormTextField = forwardRef(function FormTextField(
  { sx, InputLabelProps, ...textFieldProps },
  ref,
) {
  const mergedSx = [fieldRootSx]

  if (Array.isArray(sx)) {
    mergedSx.push(...sx)
  } else if (sx) {
    mergedSx.push(sx)
  }

  return (
    <TextField
      {...textFieldProps}
      ref={ref}
      fullWidth
      variant="outlined"
      InputLabelProps={InputLabelProps}
      sx={mergedSx}
    />
  )
})

export default FormTextField

