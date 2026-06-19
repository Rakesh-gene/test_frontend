import { useEffect, useId, useMemo, useState } from 'react'
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import FormAlert from '../../components/common/FormAlert.jsx'
import FormTextField from '../../components/common/FormTextField.jsx'
import PrimaryActionButton from '../../components/common/PrimaryActionButton.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getInitialValues(user) {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
  }
}

function validateUser(values) {
  const errors = {}
  const firstName = values.firstName.trim()
  const lastName = values.lastName.trim()
  const email = values.email.trim()

  if (!firstName) {
    errors.firstName = 'First name is required.'
  } else if (firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters.'
  }

  if (!lastName) {
    errors.lastName = 'Last name is required.'
  } else if (lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters.'
  }

  if (!email) {
    errors.email = 'Email address is required.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  return errors
}

function UserEditDialog({ open, user, onClose, onSave }) {
  const titleId = useId()
  const [values, setValues] = useState(() => getInitialValues(user))
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
  })
  const [serverFieldErrors, setServerFieldErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  const [submission, setSubmission] = useState({
    status: 'idle',
    title: '',
    detail: '',
  })
  const [submitAttempted, setSubmitAttempted] = useState(false)

  useEffect(() => {
    if (!open || !user) {
      return
    }

    setValues(getInitialValues(user))
    setTouched({
      firstName: false,
      lastName: false,
      email: false,
    })
    setServerFieldErrors({
      firstName: '',
      lastName: '',
      email: '',
    })
    setSubmission({
      status: 'idle',
      title: '',
      detail: '',
    })
    setSubmitAttempted(false)
  }, [open, user])

  const localErrors = useMemo(() => validateUser(values), [values])
  const visibleErrors = {
    firstName: serverFieldErrors.firstName || (touched.firstName || submitAttempted ? localErrors.firstName ?? '' : ''),
    lastName: serverFieldErrors.lastName || (touched.lastName || submitAttempted ? localErrors.lastName ?? '' : ''),
    email: serverFieldErrors.email || (touched.email || submitAttempted ? localErrors.email ?? '' : ''),
  }
  const hasVisibleErrors = Boolean(visibleErrors.firstName || visibleErrors.lastName || visibleErrors.email)
  const isSubmitting = submission.status === 'submitting'

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

    if (submission.status !== 'idle') {
      setSubmission({
        status: 'idle',
        title: '',
        detail: '',
      })
    }
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

    setSubmitAttempted(true)
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
    })

    if (Object.keys(localErrors).length > 0) {
      return
    }

    setSubmission({
      status: 'submitting',
      title: '',
      detail: '',
    })
    setServerFieldErrors({
      firstName: '',
      lastName: '',
      email: '',
    })

    try {
      await onSave(user, {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
      })
      onClose()
    } catch (error) {
      const apiError = error && typeof error === 'object' ? error : null

      setServerFieldErrors({
        firstName: apiError?.fieldErrors?.firstName || '',
        lastName: apiError?.fieldErrors?.lastName || '',
        email: apiError?.fieldErrors?.email || '',
      })
      setSubmission({
        status: 'error',
        title: apiError?.title || 'Update failed',
        detail: apiError?.detail || 'The user profile could not be updated right now.',
      })
    }
  }

  const dialogMessage =
    submission.status === 'error'
      ? {
          severity: 'error',
          title: submission.title || 'Update failed',
          message: submission.detail || 'The user profile could not be updated right now.',
        }
      : hasVisibleErrors
        ? {
            severity: 'error',
            title: 'Validation required',
            message: 'Fix the highlighted fields before saving.',
          }
        : {
            severity: 'info',
            title: 'Edit user profile',
            message: 'Update the user’s profile details. Password changes are not part of this flow.',
          }

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (isSubmitting) {
          return
        }

        onClose()
      }}
      fullWidth
      maxWidth="sm"
      aria-labelledby={titleId}
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: 'hidden',
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle id={titleId} sx={{ pb: 1 }}>
          <Stack spacing={0.75}>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.6 }}>
              User details
            </Typography>
            <Typography variant="h5" component="div">
              Edit user
            </Typography>
            {user ? (
              <Typography variant="body2" color="text.secondary">
                Editing {user.firstName} {user.lastName}
              </Typography>
            ) : null}
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            <FormAlert severity={dialogMessage.severity} title={dialogMessage.title}>
              {dialogMessage.message}
            </FormAlert>

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
                helperText={visibleErrors.firstName || 'As shown on the profile.'}
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
              helperText={visibleErrors.email || 'This value is used for account contact and sign-in.'}
              disabled={isSubmitting}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            Changes are saved immediately and the current page is refreshed after a successful update.
          </Typography>

          <Stack direction="row" spacing={1}>
            <PrimaryActionButton
              type="button"
              loading={false}
              fullWidth={false}
              onClick={onClose}
              disabled={isSubmitting}
              sx={{
                minHeight: 44,
                borderRadius: 999,
                px: 2.5,
                color: 'text.primary',
                bgcolor: 'rgba(15, 76, 92, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(15, 76, 92, 0.12)',
                },
              }}
            >
              Cancel
            </PrimaryActionButton>

            <PrimaryActionButton type="submit" loading={isSubmitting} fullWidth={false} sx={{ px: 3 }}>
              Save changes
            </PrimaryActionButton>
          </Stack>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default UserEditDialog
