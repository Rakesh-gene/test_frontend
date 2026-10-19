import { useEffect, useId, useMemo, useState } from 'react'
import { Avatar, Box, Button, Chip, Container, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { getSession, login, logout } from '../../api/authApi.js'
import {
  FormAlert,
  FormCard,
  FormTextField,
  PasswordField,
  PrimaryActionButton,
} from '../../components/common/index.js'

const initialValues = { email: '', password: '' }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(values) {
  const errors = {}
  const email = values.email.trim()

  if (!email) errors.email = 'Email address is required.'
  else if (!emailPattern.test(email)) errors.email = 'Enter a valid email address.'
  if (!values.password) errors.password = 'Password is required.'
  else if (values.password.length < 8) errors.password = 'Use at least 8 characters.'

  return errors
}

function LoginPage() {
  const navigate = useNavigate()
  const statusId = useId()
  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState({ email: false, password: false })
  const [session, setSession] = useState(null)
  const [sessionStatus, setSessionStatus] = useState('checking')
  const [submission, setSubmission] = useState({ status: 'idle', message: '' })
  const [serverErrors, setServerErrors] = useState({})

  const localErrors = useMemo(() => validate(values), [values])
  const visibleErrors = {
    email: serverErrors.email || (touched.email ? localErrors.email : ''),
    password: serverErrors.password || (touched.password ? localErrors.password : ''),
  }
  const isValid = Object.keys(localErrors).length === 0
  const isSubmitting = submission.status === 'submitting'

  useEffect(() => {
    let active = true
    getSession()
      .then((currentSession) => {
        if (!active) return
        setSession(currentSession)
        setSessionStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setSessionStatus('ready')
      })
    return () => {
      active = false
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setServerErrors((current) => ({ ...current, [name]: '' }))
    setSubmission({ status: 'idle', message: '' })
  }

  const handleBlur = (event) => {
    setTouched((current) => ({ ...current, [event.target.name]: true }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setTouched({ email: true, password: true })
    setServerErrors({})

    if (!isValid) {
      setSubmission({ status: 'error', message: 'Fix the highlighted fields before continuing.' })
      return
    }

    setSubmission({ status: 'submitting', message: '' })

    try {
      const nextSession = await login(values.email.trim(), values.password)
      setSession(nextSession)
      setValues(initialValues)
      navigate('/users', { replace: true })
    } catch (error) {
      const fieldErrors = error?.body?.errors ?? {}
      setServerErrors({
        email: fieldErrors.email?.[0] || '',
        password: fieldErrors.password?.[0] || '',
      })
      setSubmission({
        status: 'error',
        message:
          error?.status === 401
            ? 'The email address or password is incorrect.'
            : error?.message || 'Unable to sign in right now. Please try again.',
      })
    }
  }

  const handleLogout = async () => {
    setSubmission({ status: 'submitting', message: '' })
    try {
      await logout()
      setSession(null)
      setSubmission({ status: 'idle', message: '' })
    } catch (error) {
      setSubmission({ status: 'error', message: error?.message || 'Unable to sign out right now.' })
    }
  }

  if (sessionStatus === 'checking') {
    return (
      <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
        <Typography role="status">Checking your session…</Typography>
      </Box>
    )
  }

  if (session) {
    const user = session.user
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email
    return (
      <Box component="main" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="sm">
          <FormCard eyebrow="Authentication" title="You are signed in" description="Your secure browser session is active.">
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Stack spacing={0.5}>
                <Typography variant="h6">{displayName}</Typography>
                <Typography color="text.secondary">{user?.email}</Typography>
              </Stack>
              {submission.status === 'error' ? (
                <FormAlert severity="error" title="Sign-out failed">{submission.message}</FormAlert>
              ) : null}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
                <Button component={RouterLink} to="/users" variant="contained" fullWidth>
                  Continue to users
                </Button>
                <Button variant="outlined" onClick={handleLogout} disabled={isSubmitting} fullWidth>
                  {isSubmitting ? 'Signing out…' : 'Sign out'}
                </Button>
              </Stack>
            </Stack>
          </FormCard>
        </Container>
      </Box>
    )
  }

  return (
    <Box component="main" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>R</Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                Registration Portal
              </Typography>
              <Typography variant="body2" color="text.secondary">Secure account access</Typography>
            </Box>
            <Chip label="Sign in" color="secondary" variant="outlined" sx={{ ml: 'auto', fontWeight: 700 }} />
          </Stack>

          <FormCard eyebrow="Welcome back" title="Sign in to your account" description="Use your account credentials to continue.">
            <Stack component="form" spacing={2.5} onSubmit={handleSubmit} noValidate aria-describedby={statusId}>
              {submission.status === 'error' ? (
                <FormAlert severity="error" title="Sign-in failed" id={statusId}>{submission.message}</FormAlert>
              ) : null}
              <FormTextField
                label="Email address"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                autoComplete="email"
                error={Boolean(visibleErrors.email)}
                helperText={visibleErrors.email || 'Use the email address associated with your account.'}
                disabled={isSubmitting}
              />
              <PasswordField
                label="Password"
                name="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                error={Boolean(visibleErrors.password)}
                helperText={visibleErrors.password || 'Use at least 8 characters.'}
                disabled={isSubmitting}
              />
              <PrimaryActionButton loading={isSubmitting} disabled={!isValid && touched.email && touched.password}>
                Sign in
              </PrimaryActionButton>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Need an account?{' '}
                <Link component={RouterLink} to="/" underline="hover">Register here</Link>
              </Typography>
            </Stack>
          </FormCard>
        </Stack>
      </Container>
    </Box>
  )
}

export default LoginPage
