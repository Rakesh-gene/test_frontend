export const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

export const initialTouched = {
  firstName: false,
  lastName: false,
  email: false,
  password: false,
}

export const emptyFieldErrors = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const minimumPasswordLength = 8

export const fieldLabels = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email address',
  password: 'Password',
}

export function getEmptyFieldErrors() {
  return { ...emptyFieldErrors }
}

export function validateRegistration(values) {
  const errors = {}
  const firstName = values.firstName.trim()
  const lastName = values.lastName.trim()
  const email = values.email.trim()
  const password = values.password

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

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < minimumPasswordLength) {
    errors.password = `Use at least ${minimumPasswordLength} characters.`
  }

  return errors
}

export function getFieldError(localErrors, serverErrors, touched, fieldName) {
  return serverErrors[fieldName] || (touched[fieldName] ? localErrors[fieldName] ?? '' : '')
}

export function getSubmissionMessage(submission, createdUser, hasVisibleErrors) {
  if (submission.status === 'submitting') {
    return {
      severity: 'info',
      title: 'Submitting registration',
      message: 'Sending the registration details to the backend.',
    }
  }

  if (submission.status === 'success') {
    const message =
      createdUser != null
        ? `User #${createdUser.id} was created for ${createdUser.email}.`
        : submission.detail || 'The account was created successfully.'

    return {
      severity: 'success',
      title: submission.title || 'Registration complete',
      message,
    }
  }

  if (submission.status === 'error') {
    return {
      severity: 'error',
      title: submission.title || 'Registration failed',
      message: submission.detail || 'Unable to create the account right now.',
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
    title: 'Form requirements',
    message:
      'All fields are required. Use a valid email address and a password with at least 8 characters.',
  }
}
