import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App.jsx'
import { loginUser } from '../../api/loginApi.js'

vi.mock('../../api/loginApi.js', () => ({
  loginUser: vi.fn(),
}))

function renderLoginRoute() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders the login form with accessible controls and guidance', () => {
    renderLoginRoute()

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()

    const alert = screen.getByRole('alert')
    expect(within(alert).getByText(/welcome back/i)).toBeInTheDocument()
    expect(
      within(alert).getByText(/use the email address and password associated with your account/i),
    ).toBeInTheDocument()

    expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^password\s*\*?$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /need an account\? create one/i })).toBeInTheDocument()
  })

  it('shows validation errors and avoids submitting when required fields are missing', async () => {
    const user = userEvent.setup()

    renderLoginRoute()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(loginUser).not.toHaveBeenCalled()
    expect(await screen.findByText(/validation required/i)).toBeInTheDocument()
    expect(screen.getByText(/email address is required\./i)).toBeInTheDocument()
    expect(screen.getByText(/password is required\./i)).toBeInTheDocument()
  })

  it('submits valid credentials and redirects to user management on success', async () => {
    loginUser.mockResolvedValueOnce({
      user: {
        firstName: 'Ada',
      },
    })
    const user = userEvent.setup()

    renderLoginRoute()

    await user.type(screen.getByRole('textbox', { name: /email address/i }), ' ada@example.com ')
    await user.type(screen.getByLabelText(/^password\s*\*?$/i), 'supersecret')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(loginUser).toHaveBeenCalledWith({
      email: 'ada@example.com',
      password: 'supersecret',
    })

    expect(await screen.findByText(/welcome back, ada\./i)).toBeInTheDocument()
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /manage users/i })).toBeInTheDocument()
      },
      { timeout: 2500 },
    )
  })

  it('surfaces backend login failures in the alert and inline field errors', async () => {
    loginUser.mockRejectedValueOnce({
      title: 'Sign in failed',
      detail: 'Invalid email or password.',
      fieldErrors: {
        email: 'No account found for that email address.',
      },
    })

    const user = userEvent.setup()

    renderLoginRoute()

    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'ada@example.com')
    await user.type(screen.getByLabelText(/^password\s*\*?$/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/sign in failed/i)).toBeInTheDocument()
    expect(screen.getByText(/invalid email or password\./i)).toBeInTheDocument()
    expect(screen.getByText(/no account found for that email address\./i)).toBeInTheDocument()
  })
})
