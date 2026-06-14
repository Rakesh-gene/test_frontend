import { afterEach, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { act, screen } from '@testing-library/react'
import { renderWithTheme } from '../../../test/test-utils.jsx'

const { registerUser } = vi.hoisted(() => ({
  registerUser: vi.fn(),
}))

vi.mock('../../../api/registrationApi.js', () => ({
  registerUser,
}))

import RegistrationPage from '../RegistrationPage.jsx'

function deferred() {
  let resolve
  let reject

  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

async function fillValidRegistration(user, overrides = {}) {
  await user.type(screen.getByLabelText(/first name/i), overrides.firstName ?? 'Ava')
  await user.type(screen.getByLabelText(/last name/i), overrides.lastName ?? 'Johnson')
  await user.type(screen.getByLabelText(/email address/i), overrides.email ?? 'ava@example.com')
  await user.type(
    screen.getByLabelText(/password/i, { selector: 'input' }),
    overrides.password ?? 'correcthorsebattery',
  )
}

beforeEach(() => {
  registerUser.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('RegistrationPage', () => {
  it('renders the initial messaging and form structure', () => {
    renderWithTheme(<RegistrationPage />)

    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByText('Form requirements')).toBeInTheDocument()
    expect(
      screen.getByText(
        'All fields are required. Use a valid email address and a password with at least 8 characters.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i, { selector: 'input' })).toHaveAttribute('type', 'password')
    expect(screen.getByRole('button', { name: 'Show password' })).toBeInTheDocument()
  })

  it('shows required-field validation on blur and submit', async () => {
    const user = userEvent.setup()

    renderWithTheme(<RegistrationPage />)

    await user.click(screen.getByLabelText(/first name/i))
    await user.tab()

    expect(screen.getByText('First name is required.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Please fix the following fields:')).toBeInTheDocument()
    expect(screen.getByText('Last name: Last name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email address: Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Password: Password is required.')).toBeInTheDocument()
  })

  it('validates email format and password length before submit', async () => {
    const user = userEvent.setup()

    renderWithTheme(<RegistrationPage />)

    await user.type(screen.getByLabelText(/email address/i), 'ava@')
    await user.tab()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/email address/i))
    await user.type(screen.getByLabelText(/password/i, { selector: 'input' }), 'short')
    await user.tab()
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
  })

  it('toggles password visibility with an accessible action label', async () => {
    const user = userEvent.setup()

    renderWithTheme(<RegistrationPage />)

    const password = screen.getByLabelText(/password/i, { selector: 'input' })
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('disables the form while submitting and shows success afterward', async () => {
    const user = userEvent.setup()
    const request = deferred()

    registerUser.mockReturnValueOnce(request.promise)

    renderWithTheme(<RegistrationPage />)

    await fillValidRegistration(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(registerUser).toHaveBeenCalledWith({
      firstName: 'Ava',
      lastName: 'Johnson',
      email: 'ava@example.com',
      password: 'correcthorsebattery',
    })
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeDisabled()

    await act(async () => {
      request.resolve({
        id: 7,
        email: 'ava@example.com',
        createdAtUtc: '2024-01-01T00:00:00Z',
      })
    })

    expect(screen.getByText('Registration complete')).toBeInTheDocument()
    expect(screen.getByText('User #7 was created for ava@example.com.')).toBeInTheDocument()
    expect(screen.getByText('The backend accepted the registration payload.')).toBeInTheDocument()
  })

  it('maps backend validation, conflict, and generic failures deterministically', async () => {
    const user = userEvent.setup()

    renderWithTheme(<RegistrationPage />)

    await fillValidRegistration(user, {
      email: 'ava@example.com',
      password: 'correcthorsebattery',
    })

    registerUser.mockRejectedValueOnce({
      title: 'Validation failed',
      detail: 'Review the highlighted fields.',
      fieldErrors: {
        email: 'Server says the email is invalid.',
        password: 'Server says the password is weak.',
      },
    })

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Validation failed')).toBeInTheDocument()
    expect(screen.getByText('Review the highlighted fields.')).toBeInTheDocument()
    expect(screen.getByText('Email address: Server says the email is invalid.')).toBeInTheDocument()
    expect(screen.getByText('Password: Server says the password is weak.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/email address/i))
    await user.type(screen.getByLabelText(/email address/i), 'ava.new@example.com')

    expect(screen.queryByText('Server says the email is invalid.')).not.toBeInTheDocument()
    expect(screen.getByText('Password: Server says the password is weak.')).toBeInTheDocument()

    registerUser.mockRejectedValueOnce({
      status: 409,
      title: 'Email already in use',
      detail: 'A user with that email already exists.',
      fieldErrors: {
        email: 'A user with that email already exists.',
      },
    })

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Email already in use')).toBeInTheDocument()
    expect(screen.getByText('Email address: A user with that email already exists.')).toBeInTheDocument()

    registerUser.mockRejectedValueOnce(new Error('network down'))

    await user.clear(screen.getByLabelText(/email address/i))
    await user.type(screen.getByLabelText(/email address/i), 'ava.final@example.com')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Registration failed')).toBeInTheDocument()
    expect(screen.getAllByText('Unable to create the account right now.').length).toBeGreaterThan(0)
  })
})
