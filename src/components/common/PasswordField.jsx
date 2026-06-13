import { useState } from 'react'
import { Button, InputAdornment } from '@mui/material'
import FormTextField from './FormTextField.jsx'

/**
 * Password input with an inline visibility toggle.
 */
function PasswordField({
  label,
  name,
  value,
  onChange,
  onBlur,
  helperText,
  error = false,
  required = false,
  autoComplete = 'current-password',
  placeholder,
  disabled = false,
  fullWidth = true,
  sx,
  inputProps,
  slotProps,
}) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <FormTextField
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
      type={isVisible ? 'text' : 'password'}
      disabled={disabled}
      fullWidth={fullWidth}
      sx={sx}
      inputProps={inputProps}
      slotProps={slotProps}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <Button
              type="button"
              variant="text"
              size="small"
              onClick={() => setIsVisible((current) => !current)}
              onMouseDown={(event) => event.preventDefault()}
              disabled={disabled}
              sx={{ minWidth: 0, px: 1, textTransform: 'none' }}
              aria-label={isVisible ? 'Hide password' : 'Show password'}
            >
              {isVisible ? 'Hide' : 'Show'}
            </Button>
          </InputAdornment>
        ),
      }}
    />
  )
}

export default PasswordField
