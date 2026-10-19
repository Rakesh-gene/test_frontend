import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSession, login, logout } from './authApi.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('authentication API', () => {
  it('posts credentials with the browser session included and returns the session', async () => {
    const session = { user: { id: 7, email: 'ada@example.com' } }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(login('ada@example.com', 'Password123!')).resolves.toEqual(session)

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: 'ada@example.com', password: 'Password123!' }),
    })
  })

  it('normalizes unauthorized sessions to no active session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getSession()).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/session', {
      credentials: 'include',
    })
  })

  it('returns the server error for failed login requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Invalid credentials.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(login('ada@example.com', 'wrong-password')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid credentials.',
    })
  })

  it('logs out with the browser session included', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(logout()).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  })
})
