import { useEffect, useId, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { loginUser } from '../../api/loginApi.js'
import {
  FormAlert,
  FormCard,
  FormTextField,
  PasswordField,
  PrimaryActionButton,
} from '../../components/common/index.js'

const initialValues = {
  email: '',
  password: '',
}

const initialTouched = {
  email: false,
  password: false,
}

const emptyFieldErrors = {
  email: '',
  password: '',
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const minimumPasswordLength = 8

function validateLogin(values) {
  const errors = {}
  const email = values.email.trim()
  const password = values.password

  if (!email) {
    errors.email = 'Email address is required.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < minimumPasswordLength) {
    errors.password = `Use at least ${minimumPasswordLength} characters.`
  }

  return errors
}

function getFieldError(localErrors, serverErrors, touched, fieldName) {
  return serverErrors[fieldName] || (touched[fieldName] ? localErrors[fieldName] ?? '' : '')
}

function getEmptyFieldErrors() {
  return { ...emptyFieldErrors }
}

function getSubmissionMessage(submission, hasVisibleErrors) {
  if (submission.status === 'submitting') {
    return {
      severity: 'info',
      title: 'Signing in',
      message: 'Sending your credentials to the backend.',
    }
  }

  if (submission.status === 'success') {
    return {
      severity: 'success',
      title: submission.title || 'Signed in',
      message: submission.detail || 'Your session is ready.',
    }
  }

  if (submission.status === 'error') {
    return {
      severity: 'error',
      title: submission.title || 'Sign in failed',
      message: submission.detail || 'Unable to sign in right now.',
    }
  }

  if (hasVisibleErrors) {
    return {
      severity: 'error',
      title: 'Validation required',
      message: 'Fix the highlighted fields before continuing.',
    }
  }

  return {
    severity: 'info',
    title: 'Welcome back',
    message: 'Use the email address and password associated with your account.',
  }
}

function LoginPage() {
  const summaryId = useId()
  const navigate = useNavigate()

  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState(initialTouched)
  const [submitCount, setSubmitCount] = useState(0)
  const [serverFieldErrors, setServerFieldErrors] = useState(getEmptyFieldErrors)
  const [submission, setSubmission] = useState({
    status: 'idle',
    title: '',
    detail: '',
  })

  const localErrors = useMemo(() => validateLogin(values), [values])
  const visibleErrors = {
    email: getFieldError(localErrors, serverFieldErrors, touched, 'email'),
    password: getFieldError(localErrors, serverFieldErrors, touched, 'password'),
  }
  const hasVisibleErrors = Object.values(visibleErrors).some(Boolean)
  const isValid = Object.keys(localErrors).length === 0
  const isSubmitting = submission.status === 'submitting'
  const message = getSubmissionMessage(submission, hasVisibleErrors)

  useEffect(() => {
    if (submission.status !== 'success') {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/users', { replace: true })
    }, 1200)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, submission.status])

  const handleChange = (event) => {
    const { name, value } = event.target

    setValues((current) => ({
      ...current,
      [name]: value,
    }))

    setServerFieldErrors((current) => {
      if (!current[name]) {
        return current
      }

      return {
        ...current,
        [name]: '',
      }
    })

    setSubmission((current) =>
      current.status === 'idle' ? current : { status: 'idle', title: '', detail: '' },
    )
  }

  const handleBlur = (event) => {
    const { name } = event.target

    setTouched((current) => ({
      ...current,
      [name]: true,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSubmitCount((current) => current + 1)
    setTouched({
      email: true,
      password: true,
    })

    if (!isValid) {
      return
    }

    setSubmission({
      status: 'submitting',
      title: '',
      detail: '',
    })
    setServerFieldErrors(getEmptyFieldErrors())

    try {
      const result = await loginUser({
        email: values.email.trim(),
        password: values.password,
      })
      const firstName = result?.user?.firstName ?? 'there'

      setValues((current) => ({
        ...current,
        password: '',
      }))
      setSubmission({
        status: 'success',
        title: 'Signed in',
        detail: `Welcome back, ${firstName}. Redirecting to user management.`,
      })
    } catch (error) {
      const apiError = error && typeof error === 'object' ? error : null
      const nextFieldErrors =
        apiError && typeof apiError.fieldErrors === 'object' ? apiError.fieldErrors : getEmptyFieldErrors()

      setServerFieldErrors({
        ...getEmptyFieldErrors(),
        ...nextFieldErrors,
      })
      setSubmission({
        status: 'error',
        title: apiError?.title || 'Sign in failed',
        detail: apiError?.detail || 'Unable to sign in right now.',
      })
    }
  }

  const headerCopy =
    submission.status === 'success'
      ? 'Signed in successfully'
      : hasVisibleErrors
        ? 'Fix the highlighted fields'
        : 'Welcome back'
  const chipLabel =
    submission.status === 'success'
      ? 'Signed in'
      : submission.status === 'submitting'
        ? 'Signing in'
        : submission.status === 'error'
          ? 'Action needed'
          : submitCount > 0 && isValid
            ? 'Ready'
            : 'Client validation'
  const chipColor =
    submission.status === 'success'
      ? 'success'
      : submission.status === 'submitting'
        ? 'primary'
        : submission.status === 'error'
          ? 'error'
          : submitCount > 0 && isValid
            ? 'success'
            : 'primary'

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        py: { xs: 3, md: 5 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(circle at top left, rgba(15, 76, 92, 0.12), transparent 34%), radial-gradient(circle at bottom right, rgba(195, 111, 39, 0.14), transparent 30%)',
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, md: 4 },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ flexWrap: 'wrap' }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 700,
              }}
            >
              R
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                Registration Portal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Secure account access
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Button component={RouterLink} to="/" variant="outlined">
              Create account
            </Button>
            <Chip label={chipLabel} color={chipColor} variant="outlined" sx={{ fontWeight: 700 }} />
          </Stack>
        </Stack>

        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <Stack spacing={3} sx={{ height: '100%', justifyContent: 'center' }}>
              <Stack spacing={1.5}>
                <Chip
                  label="Login"
                  color="secondary"
                  variant="filled"
                  sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
                />
                <Typography variant="h2" component="h1">
                  {headerCopy}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: 520, fontSize: { xs: '1rem', md: '1.0625rem' } }}
                >
                  Sign in with the credentials stored by the backend. The form keeps your input
                  intact, highlights validation errors inline, and surfaces backend failures in a
                  visible message panel.
                </Typography>
              </Stack>

              <FormAlert severity={message.severity} title={message.title} sx={{ alignItems: 'flex-start' }}>
                {message.message}
              </FormAlert>
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <FormCard
              eyebrow="Secure access"
              title="Sign in to continue"
              description="Use the email address and password associated with your account."
              sx={{ minHeight: { xs: 'auto', md: '100%' } }}
            >
              <Box component="form" noValidate onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <Stack spacing={2}>
                    <FormTextField
                      label="Email address"
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      autoComplete="email"
                      type="email"
                      placeholder="ada@example.com"
                      error={Boolean(visibleErrors.email)}
                      helperText={visibleErrors.email || 'Use the email address you registered with.'}
                      disabled={isSubmitting}
                      inputProps={{
                        'aria-describedby': `${summaryId}-email`,
                      }}
                      slotProps={{
                        formHelperText: {
                          id: `${summaryId}-email`,
                        },
                      }}
                    />

                    <PasswordField
                      label="Password"
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      autoComplete="current-password"
                      placeholder="Your account password"
                      error={Boolean(visibleErrors.password)}
                      helperText={visibleErrors.password || 'Keep this private on shared devices.'}
                      disabled={isSubmitting}
                      inputProps={{
                        'aria-describedby': `${summaryId}-password`,
                      }}
                      slotProps={{
                        formHelperText: {
                          id: `${summaryId}-password`,
                        },
                      }}
                    />
                  </Stack>

                  <Stack spacing={1.5}>
                    <PrimaryActionButton loading={isSubmitting}>
                      Sign in
                    </PrimaryActionButton>

                    <Button component={RouterLink} to="/" variant="text" sx={{ alignSelf: 'center' }}>
                      Need an account? Create one
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            </FormCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default LoginPage
