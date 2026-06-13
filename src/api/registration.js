const registrationEndpoint = '/api/user/register'

const fieldNameAliases = {
  confirmPassword: ['confirmPassword', 'confirm_password', 'passwordConfirmation', 'password_confirmation'],
  email: ['email', 'emailAddress', 'email_address'],
  fullName: ['fullName', 'full_name', 'name', 'firstName', 'first_name'],
  password: ['password', 'passcode'],
}

export class RegistrationApiError extends Error {
  constructor(message, { status, fieldErrors = {}, details = null } = {}) {
    super(message)
    this.name = 'RegistrationApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.details = details
  }
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (value === null || value === undefined) {
    return []
  }

  return [value]
}

function normalizeFieldName(fieldName) {
  const candidate = String(fieldName ?? '').trim()

  for (const [targetField, aliases] of Object.entries(fieldNameAliases)) {
    if (aliases.includes(candidate)) {
      return targetField
    }
  }

  if (!candidate) {
    return candidate
  }

  return candidate
    .replace(/[_\s-]+([a-z])/gi, (_, letter) => letter.toUpperCase())
    .replace(/^[A-Z]/, (letter) => letter.toLowerCase())
}

function extractMessage(candidate, fallback) {
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim()
  }

  if (Array.isArray(candidate) && candidate.length > 0) {
    const firstMessage = extractMessage(candidate[0], '')
    if (firstMessage) {
      return firstMessage
    }
  }

  if (candidate && typeof candidate === 'object') {
    return (
      extractMessage(candidate.message, '') ||
      extractMessage(candidate.detail, '') ||
      extractMessage(candidate.error, '') ||
      extractMessage(candidate.title, '') ||
      extractMessage(candidate.description, '') ||
      fallback
    )
  }

  return fallback
}

function collectFieldErrors(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {}
  }

  const fieldErrors = {}

  for (const [fieldName, value] of Object.entries(source)) {
    if (['message', 'title', 'detail', 'description', 'error', 'type', 'status'].includes(fieldName)) {
      continue
    }

    const normalizedFieldName = normalizeFieldName(fieldName)
    const message = toArray(value)
      .map((item) => extractMessage(item, ''))
      .find(Boolean)

    if (normalizedFieldName && message) {
      fieldErrors[normalizedFieldName] = message
    }
  }

  return fieldErrors
}

function parseValidationPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { fieldErrors: {}, message: '' }
  }

  const fieldErrors = {
    ...collectFieldErrors(payload.errors),
    ...collectFieldErrors(payload.validationErrors),
    ...collectFieldErrors(payload.fieldErrors),
  }

  if (Array.isArray(payload.errors)) {
    payload.errors.forEach((item) => {
      if (item && typeof item === 'object') {
        const normalizedFieldName = normalizeFieldName(item.field ?? item.name ?? item.property)
        const message = extractMessage(item.message ?? item.error ?? item.description ?? item.detail, '')

        if (normalizedFieldName && message) {
          fieldErrors[normalizedFieldName] = message
        }
      }
    })
  }

  return {
    fieldErrors,
    message:
      extractMessage(payload.message, '') ||
      extractMessage(payload.detail, '') ||
      extractMessage(payload.title, ''),
  }
}

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

function createRegistrationRequestBody(payload) {
  const fullName = String(payload?.fullName ?? payload?.name ?? '').trim()
  const email = String(payload?.email ?? '').trim()

  return {
    confirmPassword: String(payload?.confirmPassword ?? ''),
    email,
    fullName,
    name: fullName,
    password: String(payload?.password ?? ''),
  }
}

export async function registerUser(payload) {
  const response = await fetch(registrationEndpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createRegistrationRequestBody(payload)),
  })

  const responseBody = await readResponseBody(response)

  if (!response.ok) {
    const { fieldErrors, message } = parseValidationPayload(responseBody)
    const defaultMessage =
      response.status === 409
        ? 'An account with that email already exists.'
        : response.status === 400
          ? 'Please correct the highlighted fields and try again.'
          : 'Registration could not be completed.'

    throw new RegistrationApiError(message || defaultMessage, {
      status: response.status,
      fieldErrors,
      details: responseBody,
    })
  }

  return responseBody ?? {}
}
