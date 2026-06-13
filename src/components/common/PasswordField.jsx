import { Fragment, forwardRef, useId, useState } from 'react'
import { Button, InputAdornment } from '@mui/material'
import FormTextField from './FormTextField'

const PasswordField = forwardRef(function PasswordField(
  { InputProps, label = 'Password', helperText, sx, ...textFieldProps },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false)
  const generatedId = useId()
  const inputId = textFieldProps.id ?? generatedId
  const { endAdornment: inputEndAdornment, ...restInputProps } = InputProps ?? {}

  return (
    <FormTextField
      {...textFieldProps}
      inputRef={ref}
      id={inputId}
      label={label}
      type={showPassword ? 'text' : 'password'}
      helperText={helperText}
      sx={sx}
      InputProps={{
        ...restInputProps,
        endAdornment: (
          <Fragment>
            {inputEndAdornment}
            <InputAdornment position="end">
              <Button
                type="button"
                size="small"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`
                }
                aria-pressed={showPassword}
                sx={{ minWidth: 'auto', px: 1, fontWeight: 700 }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Button>
            </InputAdornment>
          </Fragment>
        ),
      }}
    />
  )
})

export default PasswordField
