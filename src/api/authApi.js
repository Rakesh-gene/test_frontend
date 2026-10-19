async function readResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { detail: text } : null
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'include',
  })
  const body = await readResponseBody(response)

  if (!response.ok) {
    const error = new Error(body?.detail || body?.title || 'Unable to complete the authentication request.')
    error.status = response.status
    error.body = body
    throw error
  }

  return body
}

export function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
}

export async function getSession() {
  try {
    return await request('/api/auth/session')
  } catch (error) {
    if (error?.status === 401) {
      return null
    }

    throw error
  }
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' })
}
