const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * @param {{ firstName?: string, lastName?: string, email?: string, password?: string, confirmPassword?: string }} values
 * @returns {Record<string, string>}
 */
export function validateRegistrationForm(values) {
  const errors = {}
  const firstName = normalizeText(values.firstName)
  const lastName = normalizeText(values.lastName)
  const email = normalizeText(values.email)
  const password = values.password ?? ''
  const confirmPassword = values.confirmPassword ?? ''

  if (!firstName) {
    errors.firstName = 'First name is required.'
  }

  if (!lastName) {
    errors.lastName = 'Last name is required.'
  }

  if (!email) {
    errors.email = 'Email address is required.'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

/**
 * @param {Record<string, string[]> | undefined} errors
 * @returns {Record<string, string>}
 */
export function normalizeServerFieldErrors(errors) {
  if (!errors || typeof errors !== 'object') {
    return {}
  }

  return Object.entries(errors).reduce((accumulator, [key, messages]) => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return accumulator
    }

    const fieldName = key.charAt(0).toLowerCase() + key.slice(1)
    accumulator[fieldName] = messages[0]
    return accumulator
  }, {})
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getRegistrationFeedbackMessage(error) {
  if (!error || typeof error !== 'object') {
    return 'We could not create the account. Please try again.'
  }

  const typedError = /** @type {{ detail?: unknown, title?: unknown, message?: unknown }} */ (error)

  if (typeof typedError.detail === 'string' && typedError.detail.trim()) {
    return typedError.detail
  }

  if (typeof typedError.title === 'string' && typedError.title.trim()) {
    return typedError.title
  }

  if (typeof typedError.message === 'string' && typedError.message.trim()) {
    return typedError.message
  }

  return 'We could not create the account. Please try again.'
}
