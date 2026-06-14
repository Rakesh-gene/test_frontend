import { useId, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Chip,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { registerUser } from '../../api/registrationApi.js'
import {
  FormAlert,
  FormCard,
  FormTextField,
  PasswordField,
  PrimaryActionButton,
} from '../../components/common/index.js'
import {
  createEmptyFieldErrors,
  fieldLabels,
  getFieldError,
  getSubmissionMessage,
  validateRegistration,
} from './registrationHelpers.js'

const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

const initialTouched = {
  firstName: false,
  lastName: false,
  email: false,
  password: false,
}

function RegistrationPage() {
  const summaryId = useId()

  const [values, setValues] = useState(initialValues)
  const [touched, setTouched] = useState(initialTouched)
  const [submitCount, setSubmitCount] = useState(0)
  const [serverFieldErrors, setServerFieldErrors] = useState(createEmptyFieldErrors)
  const [submission, setSubmission] = useState({
    status: 'idle',
    title: '',
    detail: '',
  })
  const [createdUser, setCreatedUser] = useState(null)

  const localErrors = useMemo(() => validateRegistration(values), [values])
  const visibleErrors = {
    firstName: getFieldError(localErrors, serverFieldErrors, touched, 'firstName'),
    lastName: getFieldError(localErrors, serverFieldErrors, touched, 'lastName'),
    email: getFieldError(localErrors, serverFieldErrors, touched, 'email'),
    password: getFieldError(localErrors, serverFieldErrors, touched, 'password'),
  }
  const visibleErrorEntries = Object.entries(visibleErrors).filter(([, message]) => message)
  const hasVisibleErrors = visibleErrorEntries.length > 0
  const isValid = Object.keys(localErrors).length === 0
  const isSubmitting = submission.status === 'submitting'
  const message = getSubmissionMessage(submission, createdUser, hasVisibleErrors)

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

    setSubmission((current) => (current.status === 'idle' ? current : { status: 'idle', title: '', detail: '' }))
    setCreatedUser(null)
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
      firstName: true,
      lastName: true,
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
      setServerFieldErrors(createEmptyFieldErrors())
    setCreatedUser(null)

    try {
      const created = await registerUser({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      })

      setCreatedUser(created)
      setValues((current) => ({
        ...current,
        password: '',
      }))
      setTouched({
        firstName: false,
        lastName: false,
        email: false,
        password: false,
      })
      setSubmission({
        status: 'success',
        title: 'Registration complete',
        detail: 'Your account has been created successfully.',
      })
    } catch (error) {
      const apiError = error && typeof error === 'object' ? error : null
      const nextFieldErrors =
        apiError && typeof apiError.fieldErrors === 'object' ? apiError.fieldErrors : createEmptyFieldErrors()

      setServerFieldErrors({
        ...createEmptyFieldErrors(),
        ...nextFieldErrors,
      })
      setSubmission({
        status: 'error',
        title: apiError?.title || 'Registration failed',
        detail: apiError?.detail || 'Unable to create the account right now.',
      })
    }
  }

  const headerCopy =
    submission.status === 'success'
      ? 'Account created'
      : hasVisibleErrors
        ? 'Fix the highlighted fields'
        : 'Create your account'
  const chipLabel =
    submission.status === 'success'
      ? 'Created'
      : submission.status === 'submitting'
        ? 'Submitting'
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
  const feedbackBorderColor =
    message.severity === 'success'
      ? 'rgba(46, 125, 50, 0.18)'
      : message.severity === 'error'
        ? 'rgba(176, 0, 32, 0.18)'
        : 'rgba(15, 76, 92, 0.16)'
  const feedbackBackground =
    message.severity === 'success'
      ? 'rgba(46, 125, 50, 0.06)'
      : message.severity === 'error'
        ? 'rgba(211, 47, 47, 0.05)'
        : 'rgba(15, 76, 92, 0.04)'

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
                Secure account setup
              </Typography>
            </Box>
          </Stack>

          <Chip label={chipLabel} color={chipColor} variant="outlined" sx={{ fontWeight: 700 }} />
        </Stack>

        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <Stack spacing={3} sx={{ height: '100%', justifyContent: 'center' }}>
              <Stack spacing={1.5}>
                <Chip
                  label="Registration"
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
                  Build a polished account creation experience with controlled inputs,
                  accessible validation, and clear server feedback when the backend rejects
                  the submission.
                </Typography>
              </Stack>

              <FormAlert
                severity={message.severity}
                title={message.title}
                sx={{ alignItems: 'flex-start' }}
              >
                {submission.status === 'success' && createdUser ? (
                  <Stack spacing={0.75}>
                    <Typography variant="body2">{message.message}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created at {new Date(createdUser.createdAtUtc).toLocaleString()}
                    </Typography>
                  </Stack>
                ) : (
                  message.message
                )}
              </FormAlert>
            </Stack>
          </Grid>

          <Grid item xs={12} md={7}>
            <FormCard
              eyebrow="Account setup"
              title="Create your registration details"
              description="Enter the required account information below. Errors appear inline and the form keeps your input as you edit."
              sx={{ minHeight: { xs: 'auto', md: '100%' } }}
            >
              <Box component="form" noValidate onSubmit={handleSubmit}>
                <Stack spacing={2.5}>
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                  >
                    <FormTextField
                      label="First name"
                      name="firstName"
                      value={values.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      autoComplete="given-name"
                      placeholder="Ava"
                      error={Boolean(visibleErrors.firstName)}
                      helperText={visibleErrors.firstName || 'As shown on your profile.'}
                      inputProps={{
                        'aria-describedby': `${summaryId}-firstName`,
                      }}
                      slotProps={{
                        formHelperText: {
                          id: `${summaryId}-firstName`,
                        },
                      }}
                      disabled={isSubmitting}
                    />

                    <FormTextField
                      label="Last name"
                      name="lastName"
                      value={values.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      autoComplete="family-name"
                      placeholder="Johnson"
                      error={Boolean(visibleErrors.lastName)}
                      helperText={visibleErrors.lastName || 'Enter the family name used on the account.'}
                      inputProps={{
                        'aria-describedby': `${summaryId}-lastName`,
                      }}
                      slotProps={{
                        formHelperText: {
                          id: `${summaryId}-lastName`,
                        },
                      }}
                      disabled={isSubmitting}
                    />
                  </Box>

                  <FormTextField
                    label="Email address"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="email"
                    placeholder="ava@example.com"
                    type="email"
                    error={Boolean(visibleErrors.email)}
                    helperText={visibleErrors.email || 'We will use this for account contact and sign-in.'}
                    inputProps={{
                      'aria-describedby': `${summaryId}-email`,
                    }}
                    slotProps={{
                      formHelperText: {
                        id: `${summaryId}-email`,
                      },
                    }}
                    disabled={isSubmitting}
                  />

                  <PasswordField
                    label="Password"
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    error={Boolean(visibleErrors.password)}
                    helperText={visibleErrors.password || 'Use a strong password with at least 8 characters.'}
                    inputProps={{
                      'aria-describedby': `${summaryId}-password`,
                    }}
                    slotProps={{
                      formHelperText: {
                        id: `${summaryId}-password`,
                      },
                    }}
                    disabled={isSubmitting}
                  />

                  <PrimaryActionButton type="submit" loading={isSubmitting}>
                    Create account
                  </PrimaryActionButton>

                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                    {isSubmitting
                      ? 'Submitting the registration request to the backend.'
                      : 'Required fields are validated locally before the API step.'}
                  </Typography>

                  {submitCount > 0 && !isSubmitting ? (
                    <Box
                      id={summaryId}
                      role="alert"
                      aria-live="polite"
                      sx={{
                        border: `1px solid ${feedbackBorderColor}`,
                        bgcolor: feedbackBackground,
                        borderRadius: 3,
                        p: 2,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        {hasVisibleErrors ? 'Please fix the following fields:' : 'Submission summary:'}
                      </Typography>
                      {hasVisibleErrors ? (
                        <List dense disablePadding sx={{ pl: 2.5 }}>
                          {visibleErrorEntries.map(([fieldName, messageText]) => (
                            <ListItem
                              key={fieldName}
                              component="li"
                              disableGutters
                              sx={{ display: 'list-item' }}
                            >
                              <ListItemText
                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                primary={`${fieldLabels[fieldName] ?? fieldName}: ${messageText}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {submission.status === 'success'
                            ? 'The backend accepted the registration payload.'
                            : submission.status === 'error'
                              ? submission.detail
                              : 'The form is ready to submit.'}
                        </Typography>
                      )}
                    </Box>
                  ) : null}
                </Stack>
              </Box>
            </FormCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}

export default RegistrationPage
