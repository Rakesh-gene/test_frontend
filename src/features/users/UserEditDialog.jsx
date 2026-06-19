import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import { FormTextField } from '../../components/common/index.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function createFormValues(user) {
  return {
    firstName: user?.firstName ?? user?.first_name ?? '',
    lastName: user?.lastName ?? user?.last_name ?? '',
    email: user?.email ?? user?.emailAddress ?? '',
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

function UserEditDialog({ user, open, onClose, onSave }) {
  const [values, setValues] = useState(() => createFormValues(user))
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
  const [dialogError, setDialogError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(createFormValues(user))
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
      setDialogError('')
      setIsSaving(false)
    }
  }, [open, user])

  const localErrors = useMemo(() => validateUser(values), [values])
  const visibleErrors = {
    firstName: serverFieldErrors.firstName || (touched.firstName ? localErrors.firstName ?? '' : ''),
    lastName: serverFieldErrors.lastName || (touched.lastName ? localErrors.lastName ?? '' : ''),
    email: serverFieldErrors.email || (touched.email ? localErrors.email ?? '' : ''),
  }
  const hasVisibleErrors = Boolean(
    visibleErrors.firstName || visibleErrors.lastName || visibleErrors.email,
  )

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

    if (dialogError) {
      setDialogError('')
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

    const nextTouched = {
      firstName: true,
      lastName: true,
      email: true,
    }

    setTouched(nextTouched)

    if (Object.keys(localErrors).length > 0) {
      return
    }

    setIsSaving(true)
    setDialogError('')
    setServerFieldErrors({
      firstName: '',
      lastName: '',
      email: '',
    })

    try {
      await onSave({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
      })
    } catch (error) {
      const apiError = error && typeof error === 'object' ? error : null
      const nextFieldErrors =
        apiError && typeof apiError.fieldErrors === 'object' ? apiError.fieldErrors : {}

      setServerFieldErrors({
        firstName: nextFieldErrors.firstName ?? '',
        lastName: nextFieldErrors.lastName ?? '',
        email: nextFieldErrors.email ?? '',
      })
      setDialogError(apiError?.detail || apiError?.title || 'Unable to save the user right now.')
      setIsSaving(false)
      return
    }
  }

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
      <DialogTitle>
        <Stack spacing={0.5}>
          <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.4 }}>
            Edit user
          </Typography>
          <Typography variant="h6" component="div">
            Update profile details
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Stack spacing={2.25} sx={{ mt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Change the user&apos;s name or email address. Passwords are not edited from this screen.
          </Typography>

          {dialogError ? <Alert severity="error">{dialogError}</Alert> : null}

          <FormTextField
            label="First name"
            name="firstName"
            value={values.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            helperText={visibleErrors.firstName}
            error={Boolean(visibleErrors.firstName)}
            required
            autoComplete="given-name"
            disabled={isSaving}
            inputProps={{ 'data-testid': 'user-edit-first-name' }}
          />

          <FormTextField
            label="Last name"
            name="lastName"
            value={values.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            helperText={visibleErrors.lastName}
            error={Boolean(visibleErrors.lastName)}
            required
            autoComplete="family-name"
            disabled={isSaving}
            inputProps={{ 'data-testid': 'user-edit-last-name' }}
          />

          <FormTextField
            label="Email address"
            name="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            helperText={visibleErrors.email}
            error={Boolean(visibleErrors.email)}
            required
            autoComplete="email"
            disabled={isSaving}
            inputProps={{ 'data-testid': 'user-edit-email' }}
          />

          {hasVisibleErrors ? (
            <Typography variant="body2" color="text.secondary">
              Fix the highlighted fields before saving.
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1.5 }}>
        <Button onClick={onClose} disabled={isSaving} variant="text">
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserEditDialog
