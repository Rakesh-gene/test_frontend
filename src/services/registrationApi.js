const DEFAULT_API_BASE_URL = 'http://localhost:5000'

function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL
  return (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, '')
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

export async function registerUser(payload) {
  const response = await fetch(`${getApiBaseUrl()}/api/user/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim(),
      password: payload.password,
    }),
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    const error = new Error('Registration request failed')
    error.status = response.status
    error.data = data
    throw error
  }

  return data ?? {}
}
