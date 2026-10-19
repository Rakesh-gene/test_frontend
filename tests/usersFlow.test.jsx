import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getUsers, updateUser } from '../src/api/usersApi.js'

describe('user-management flow regression', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the paginated user directory with the existing query contract', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({
      items: [{ id: 7, firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' }],
      totalCount: 1,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(getUsers({ page: 1, pageSize: 10, search: 'ada' })).resolves.toMatchObject({
      totalCount: 1,
      items: [{ id: 7, email: 'ada@example.com' }],
    })
    expect(fetch).toHaveBeenCalledWith('/api/user?page=1&pageSize=10&search=ada', {
      headers: { Accept: 'application/json' },
    })
  })

  it('keeps user edits on the existing PUT endpoint', async () => {
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ id: 7, email: 'ada@example.com' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    const payload = { firstName: 'Ada', lastName: 'Byron' }
    await expect(updateUser(7, payload)).resolves.toEqual({ id: 7, email: 'ada@example.com' })
    expect(fetch).toHaveBeenCalledWith('/api/user/7', {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })
})
