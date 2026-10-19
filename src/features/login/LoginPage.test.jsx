import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage.jsx'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/users" element={<div>Users screen</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows accessible validation messages before submitting invalid credentials', async () => {
    const user = userEvent.setup()
    fetch.mockResolvedValueOnce(new Response(null, { status: 401 }))
    renderLogin()

    await screen.findByRole('heading', { name: 'Sign in to your account' })
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByText('Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('logs in with a valid form and navigates to the users screen', async () => {
    const user = userEvent.setup()
    const session = { user: { id: 7, email: 'ada@example.com' } }
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse(session))
    renderLogin()

    await screen.findByRole('heading', { name: 'Sign in to your account' })
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'ada@example.com')
    await user.type(document.querySelector('input[type="password"]'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Users screen')).toBeInTheDocument()
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: 'ada@example.com', password: 'Password123!' }),
    })
  })

  it('shows the loading state and disables controls while login is pending', async () => {
    const user = userEvent.setup()
    let resolveLogin
    const session = { user: { id: 7, email: 'ada@example.com' } }
    fetch
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveLogin = resolve
      }))
    renderLogin()

    await screen.findByRole('heading', { name: 'Sign in to your account' })
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'ada@example.com')
    await user.type(document.querySelector('input[type="password"]'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const submitButton = screen.getByRole('button', { name: 'Sign in' })
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('textbox', { name: 'Email address' })).toBeDisabled()

    resolveLogin(new Response(JSON.stringify(session), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    expect(await screen.findByText('Users screen')).toBeInTheDocument()
  })

  it('shows a network error when login cannot reach the backend', async () => {
    const user = userEvent.setup()
    fetch.mockResolvedValueOnce(new Response(null, { status: 401 })).mockRejectedValueOnce(new Error('Network unavailable'))
    renderLogin()

    await screen.findByRole('heading', { name: 'Sign in to your account' })
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'ada@example.com')
    await user.type(document.querySelector('input[type="password"]'), 'Password123!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Network unavailable')).toBeInTheDocument()
  })

  it('loads an existing session and signs out without reading the cookie', async () => {
    const user = userEvent.setup()
    fetch
      .mockResolvedValueOnce(jsonResponse({ user: { id: 7, email: 'ada@example.com' } }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    renderLogin()

    expect(await screen.findByRole('heading', { name: 'ada@example.com' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByRole('heading', { name: 'Sign in to your account' })).toBeInTheDocument()
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  })
})
