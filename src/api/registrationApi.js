import { createRegistrationError } from '../features/registration/registrationHelpers.js'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

function buildApiUrl(path) {
  if (!apiBaseUrl) {
    return path
  }

  const normalizedBase = apiBaseUrl.endsWith('/') ? apiBaseUrl : `${apiBaseUrl}/`
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  return new URL(normalizedPath, normalizedBase).toString()
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
