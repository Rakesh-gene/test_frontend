const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const minimumPasswordLength = 8

export const fieldLabels = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email address',
  password: 'Password',
}

export const emptyFieldErrors = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

export function createEmptyFieldErrors() {
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

export function normalizeFieldName(name) {
  return String(name)
    .replace(/^request\./i, '')
    .split('.')
    .pop()
    ?.trim()
    .toLowerCase()
}

export function mapFieldName(name) {
  const normalized = normalizeFieldName(name)

  switch (normalized) {
    case 'firstname':
      return 'firstName'
    case 'lastname':
      return 'lastName'
    case 'email':
      return 'email'
    case 'password':
      return 'password'
    default:
      return null
  }
}

export function firstProblemMessage(value) {
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === 'string' && item.trim())?.trim() ?? ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

export function extractProblemPayload(problem) {
  if (!problem || typeof problem !== 'object') {
    return { title: '', detail: '', fieldErrors: {} }
  }

  const payload = problem
  const title = typeof payload.title === 'string' ? payload.title : ''
  const detail = typeof payload.detail === 'string' ? payload.detail : ''
  const rawErrors = payload.errors && typeof payload.errors === 'object' ? payload.errors : {}

  const fieldErrors = Object.entries(rawErrors).reduce((accumulator, [fieldName, value]) => {
    const mappedFieldName = mapFieldName(fieldName)
    const message = firstProblemMessage(value)

    if (mappedFieldName && message) {
      accumulator[mappedFieldName] = message
    }

    return accumulator
  }, {})

  return { title, detail, fieldErrors }
}

export function createRegistrationError(response, body) {
  const { title, detail, fieldErrors } = extractProblemPayload(body)
  const status = response.status

  if (status === 409) {
    return {
      status,
      title: title || 'Email already in use',
      detail: detail || 'A user with that email already exists.',
      fieldErrors: {
        email: detail || title || 'A user with that email already exists.',
        ...fieldErrors,
      },
    }
  }

  if (status === 400) {
    return {
      status,
      title: title || 'Please check the highlighted fields',
      detail: detail || 'One or more values are invalid.',
      fieldErrors,
    }
  }

  return {
    status,
    title: title || 'Registration failed',
    detail: detail || 'Unable to create the account right now.',
    fieldErrors,
  }
}
