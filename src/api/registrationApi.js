const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

function buildApiUrl(path) {
  if (!apiBaseUrl) {
    return path
  }

  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  return new URL(normalizedPath, normalizedBase).toString()
}

function normalizeFieldName(name) {
  return String(name)
    .replace(/^request\./i, '')
    .split('.')
    .pop()
    ?.trim()
    .toLowerCase()
}

function mapFieldName(name) {
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

function firstProblemMessage(value) {
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === 'string' && item.trim())?.trim() ?? ''
  }

  return typeof value === 'string' ? value.trim() : ''
}

function extractProblemPayload(problem) {
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

function createRegistrationError(response, body) {
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

async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { detail: text } : null
}

export async function registerUser(payload) {
  const response = await fetch(buildApiUrl('/api/user/register'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = await readResponseBody(response)

  if (!response.ok) {
    throw createRegistrationError(response, body)
  }

  return body
}
