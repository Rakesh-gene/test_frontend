import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerUser } from '../src/api/registrationApi.js'

describe('registration flow regression', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('submits the registration form to the existing user endpoint', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ id: 12, email: 'ada@example.com' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }))

    const payload = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Password123!',
    }

    await expect(registerUser(payload)).resolves.toEqual({ id: 12, email: 'ada@example.com' })
    expect(fetch).toHaveBeenCalledWith('/api/user/register', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })

  it('preserves actionable server field errors for the registration form', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({
      title: 'Validation failed',
      errors: { Email: ['Email is already registered.'] },
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(registerUser({ email: 'ada@example.com' })).rejects.toMatchObject({
      status: 400,
      fieldErrors: { email: 'Email is already registered.' },
    })
  })
})
