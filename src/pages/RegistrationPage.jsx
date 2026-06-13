import { useRef, useState } from 'react'
import { Alert, Box, Stack, Typography } from '@mui/material'
import {
  FormTextField,
  PageShell,
  PasswordField,
  PrimaryActionButton,
  SectionCard,
} from '../components/common'
import { RegistrationApiError, registerUser } from '../api/registration'

const initialValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const fieldOrder = ['fullName', 'email', 'password', 'confirmPassword']

const helperTextByField = {
  confirmPassword: 'Re-enter the password to make sure it is correct.',
  email: 'Use the email address the backend should store for this user.',
  fullName: 'Use the name the account should display.',
  password: 'Use at least 8 characters, including a letter and a number.',
}

function createEmptyErrors() {
  return {
    confirmPassword: '',
    email: '',
    fullName: '',
    password: '',
  }
}

function validateRegistration(values) {
  const errors = createEmptyErrors()
  const trimmedFullName = values.fullName.trim()
  const trimmedEmail = values.email.trim()

  if (!trimmedFullName) {
    errors.fullName = 'Enter a full name.'
  } else if (trimmedFullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.'
  }

  if (!trimmedEmail) {
    errors.email = 'Enter an email address.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!values.password) {
    errors.password = 'Enter a password.'
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.'
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = 'Password must include at least one letter and one number.'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.'
  } else if (values.password && values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

function getVisibleErrorMessage(clientErrors, serverErrors, fieldName) {
  return clientErrors[fieldName] || serverErrors[fieldName] || ''
}

function RegistrationPage() {
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({})
  const [serverErrors, setServerErrors] = useState(createEmptyErrors())
  const [feedback, setFeedback] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)

  const fieldRefs = {
    confirmPassword: useRef(null),
    email: useRef(null),
    fullName: useRef(null),
    password: useRef(null),
  }

  const clientErrors = validateRegistration(values)

  function focusFirstError(nextErrors) {
    for (const fieldName of fieldOrder) {
      if (nextErrors[fieldName]) {
        fieldRefs[fieldName].current?.focus()
        break
      }
    }
  }

  function clearFieldServerError(fieldName) {
    setServerErrors((current) => {
      if (!current[fieldName]) {
        return current
      }

      return {
        ...current,
        [fieldName]: '',
      }
    })
  }

  function handleFieldChange(fieldName) {
    return (event) => {
      const nextValue = event.target.value

      setValues((current) => ({
        ...current,
        [fieldName]: nextValue,
      }))
      clearFieldServerError(fieldName)
      setFeedback(null)
    }
  }

  function handleFieldBlur(fieldName) {
    return () => {
      setTouched((current) => ({
        ...current,
        [fieldName]: true,
      }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextClientErrors = validateRegistration(values)
    const hasClientErrors = Object.values(nextClientErrors).some(Boolean)
    const trimmedFullName = values.fullName.trim()
    const trimmedEmail = values.email.trim()

    setTouched({
      confirmPassword: true,
      email: true,
      fullName: true,
      password: true,
    })
    setSubmitAttempted(true)
    setFeedback(null)
    setServerErrors(createEmptyErrors())

    if (hasClientErrors) {
      focusFirstError(nextClientErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await registerUser({
        confirmPassword: values.confirmPassword,
        email: trimmedEmail,
        fullName: trimmedFullName,
        password: values.password,
      })

      const nextMessage =
        (response &&
          typeof response === 'object' &&
          typeof response.message === 'string' &&
          response.message.trim()) ||
        'Registration complete. The user has been created.'

      setValues((current) => ({
        ...current,
        confirmPassword: '',
        email: trimmedEmail,
        fullName: trimmedFullName,
        password: '',
      }))
      setTouched({})
      setSubmitAttempted(false)
      setFeedback({
        message: nextMessage,
        type: 'success',
      })
    } catch (error) {
      if (error instanceof RegistrationApiError) {
        setServerErrors((current) => ({
          ...current,
          ...error.fieldErrors,
        }))

        const errorMessage = error.message || 'Registration could not be completed.'
        setFeedback({
          message: errorMessage,
          type: 'error',
        })

        const mergedErrors = {
          ...nextClientErrors,
          ...error.fieldErrors,
        }

        focusFirstError(mergedErrors)
        return
      }

      setFeedback({
        message: 'An unexpected error occurred while submitting the form.',
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formStateErrors = {
    confirmPassword: getVisibleErrorMessage(clientErrors, serverErrors, 'confirmPassword'),
    email: getVisibleErrorMessage(clientErrors, serverErrors, 'email'),
    fullName: getVisibleErrorMessage(clientErrors, serverErrors, 'fullName'),
    password: getVisibleErrorMessage(clientErrors, serverErrors, 'password'),
  }

  const shouldShowFieldError = (fieldName) => touched[fieldName] || submitAttempted

  return (
    <PageShell
      eyebrow="Registration"
      title="Create your account"
      description="Build a new user record through the Vite proxy with reusable MUI form primitives."
    >
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { md: 'minmax(0, 1.35fr) minmax(280px, 0.65fr)' },
          alignItems: 'start',
        }}
      >
        <SectionCard
          title="Account details"
          description="Client-side validation runs first, then the form submits through the proxy to the backend."
          sx={{ minHeight: '100%' }}
        >
          <Box component="form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <Stack spacing={2.5}>
              {feedback ? (
                <Alert severity={feedback.type} variant="filled">
                  {feedback.message}
                </Alert>
              ) : null}

              <FormTextField
                inputRef={fieldRefs.fullName}
                label="Full name"
                name="fullName"
                autoComplete="name"
                placeholder="Alex Johnson"
                value={values.fullName}
                onChange={handleFieldChange('fullName')}
                onBlur={handleFieldBlur('fullName')}
                error={shouldShowFieldError('fullName') && Boolean(formStateErrors.fullName)}
                helperText={
                  shouldShowFieldError('fullName') && formStateErrors.fullName
                    ? formStateErrors.fullName
                    : helperTextByField.fullName
                }
                disabled={isSubmitting}
                required
              />

              <FormTextField
                inputRef={fieldRefs.email}
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="alex@example.com"
                value={values.email}
                onChange={handleFieldChange('email')}
                onBlur={handleFieldBlur('email')}
                error={shouldShowFieldError('email') && Boolean(formStateErrors.email)}
                helperText={
                  shouldShowFieldError('email') && formStateErrors.email
                    ? formStateErrors.email
                    : helperTextByField.email
                }
                disabled={isSubmitting}
                required
              />

              <PasswordField
                ref={fieldRefs.password}
                label="Password"
                name="password"
                autoComplete="new-password"
                value={values.password}
                onChange={handleFieldChange('password')}
                onBlur={handleFieldBlur('password')}
                error={shouldShowFieldError('password') && Boolean(formStateErrors.password)}
                helperText={
                  shouldShowFieldError('password') && formStateErrors.password
                    ? formStateErrors.password
                    : helperTextByField.password
                }
                disabled={isSubmitting}
                required
              />

              <PasswordField
                ref={fieldRefs.confirmPassword}
                label="Confirm password"
                name="confirmPassword"
                autoComplete="new-password"
                value={values.confirmPassword}
                onChange={handleFieldChange('confirmPassword')}
                onBlur={handleFieldBlur('confirmPassword')}
                error={
                  shouldShowFieldError('confirmPassword') &&
                  Boolean(formStateErrors.confirmPassword)
                }
                helperText={
                  shouldShowFieldError('confirmPassword') && formStateErrors.confirmPassword
                    ? formStateErrors.confirmPassword
                    : helperTextByField.confirmPassword
                }
                disabled={isSubmitting}
                required
              />

              <Stack spacing={1.25}>
                <PrimaryActionButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </PrimaryActionButton>
                <Typography variant="caption" color="text.secondary">
                  The request is sent as a relative `/api/user/register` call so the Vite proxy
                  stays in control of the backend host.
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </SectionCard>

        <SectionCard
          title="Submission notes"
          description="Useful when you are validating the flow against the backend contract."
          sx={{ minHeight: '100%' }}
        >
          <Stack spacing={2}>
            <Alert severity="info">
              Field-level validation and duplicate-email responses are mapped back into the form.
            </Alert>

            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                The frontend keeps the backend host out of source by relying on the Vite proxy.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Passwords are never echoed back into the UI after a successful response.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The form is intentionally scoped to a single registration flow and no extra auth
                behavior.
              </Typography>
            </Stack>
          </Stack>
        </SectionCard>
      </Box>
    </PageShell>
  )
}

export default RegistrationPage
