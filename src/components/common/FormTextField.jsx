import { forwardRef } from 'react'
import { TextField } from '@mui/material'

/**
 * Shared text input for form fields.
 */
const FormTextField = forwardRef(function FormTextField(
  {
    label,
    name,
    value,
    onChange,
    onBlur,
    helperText,
    error = false,
    required = false,
    autoComplete,
    placeholder,
    type = 'text',
    disabled = false,
    fullWidth = true,
    multiline = false,
    rows,
    sx,
    inputProps,
    InputProps,
    slotProps,
  },
  ref,
) {
  return (
    <TextField
      ref={ref}
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      helperText={helperText}
      error={error}
      required={required}
      autoComplete={autoComplete}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      fullWidth={fullWidth}
      multiline={multiline}
      rows={rows}
      variant="outlined"
      size="medium"
      sx={sx}
      inputProps={inputProps}
      InputProps={InputProps}
      slotProps={slotProps}
    />
  )
})

export default FormTextField
