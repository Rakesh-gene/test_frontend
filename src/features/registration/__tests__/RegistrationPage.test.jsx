import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegistrationPage from '../RegistrationPage.jsx'
import { renderWithTheme } from '../../../test/test-utils.jsx'
import { registerUser } from '../../../api/registrationApi.js'

vi.mock('../../../api/registrationApi.js', () => ({
  registerUser: vi.fn(),
}))

function createDeferred() {
  let resolve
  let reject

  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

async function fillValidForm(user, overrides = {}) {
  await user.type(screen.getByLabelText(/first name/i), overrides.firstName ?? 'Ava')
  await user.type(screen.getByLabelText(/last name/i), overrides.lastName ?? 'Johnson')
  await user.type(screen.getByLabelText(/email address/i), overrides.email ?? 'ava@example.com')
  await user.type(screen.getByLabelText(/^password/i), overrides.password ?? 'password123')
}

describe('RegistrationPage', () => {
  beforeEach(() => {
    vi.mocked(registerUser).mockReset()
  })

  it('renders the initial heading, description, and default messaging', () => {
    renderWithTheme(<RegistrationPage />)

    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByText('Secure account setup')).toBeInTheDocument()
    expect(screen.getByText('Form requirements')).toBeInTheDocument()
    expect(
      screen.getByText(
        'All fields are required. Use a valid email address and a password with at least 8 characters.',
      ),
    ).toBeInTheDocument()
  })

  it('shows required-field validation on blur and submit', async () => {
    const user = userEvent.setup()
    renderWithTheme(<RegistrationPage />)

    const firstNameInput = screen.getByLabelText(/first name/i)
    await user.click(firstNameInput)
    await user.tab()

    expect(await screen.findByText('First name is required.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Please fix the following fields:')).toBeInTheDocument()
    expect(screen.getByText('First name: First name is required.')).toBeInTheDocument()
    expect(screen.getByText('Last name: Last name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email address: Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Password: Password is required.')).toBeInTheDocument()
  })

  it('shows email format validation and password minimum length validation', async () => {
    const user = userEvent.setup()
    renderWithTheme(<RegistrationPage />)

    await user.type(screen.getByLabelText(/first name/i), 'Ava')
    await user.type(screen.getByLabelText(/last name/i), 'Johnson')
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email')
    await user.tab()

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()

    await user.click(screen.getByLabelText(/^password/i))
    await user.type(screen.getByLabelText(/^password/i), 'short')
    await user.tab()

    expect(await screen.findByText('Use at least 8 characters.')).toBeInTheDocument()
  })

  it('toggles password visibility through the accessible action label', async () => {
    const user = userEvent.setup()
    renderWithTheme(<RegistrationPage />)

    const passwordInput = screen.getByLabelText(/^password/i)
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: /show password/i }))

    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('type', 'text')
  })

  it('disables the submit action while loading and then shows success', async () => {
    const user = userEvent.setup()
    const deferred = createDeferred()
    vi.mocked(registerUser).mockReturnValueOnce(deferred.promise)

    renderWithTheme(<RegistrationPage />)
    await fillValidForm(user)

    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(screen.getByLabelText(/first name/i)).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Submitting registration')

    deferred.resolve({
      id: 42,
      email: 'ava@example.com',
      createdAtUtc: '2026-06-14T10:00:00.000Z',
    })

    await act(async () => {
      await deferred.promise
    })

    expect(await screen.findByRole('heading', { name: 'Account created' })).toBeInTheDocument()
    expect(screen.getByText('User #42 was created for ava@example.com.')).toBeInTheDocument()
    expect(screen.getByText(/Created at/i)).toBeInTheDocument()
    expect(screen.getByText('Submission summary:')).toBeInTheDocument()
    expect(screen.getByText('The backend accepted the registration payload.')).toBeInTheDocument()
  })

  it('maps backend validation failures, duplicate conflicts, generic failures, and field recovery', async () => {
    const user = userEvent.setup()
    renderWithTheme(<RegistrationPage />)

    await fillValidForm(user)
    vi.mocked(registerUser).mockRejectedValueOnce({
      status: 400,
      title: 'Validation failed',
      detail: 'One or more fields are invalid.',
      fieldErrors: {
        firstName: 'First name is required.',
        email: 'Enter a valid email address.',
      },
    })

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Validation failed')).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByText('First name is required.')).not.toHaveLength(0)
    expect(screen.getAllByText('Enter a valid email address.')).not.toHaveLength(0)

    await user.clear(screen.getByLabelText(/email address/i))
    await user.type(screen.getByLabelText(/email address/i), 'ava2@example.com')

    expect(screen.getByLabelText(/email address/i)).not.toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText('Enter a valid email address.')).toBeNull()
    expect(screen.getByText('First name is required.')).toBeInTheDocument()

    vi.mocked(registerUser).mockRejectedValueOnce({
      status: 409,
      title: 'Email already in use',
      detail: 'A user with that email already exists.',
      fieldErrors: {
        email: 'Email address is already registered.',
      },
    })

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Email already in use')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByText('Email address is already registered.')).not.toHaveLength(0)

    vi.mocked(registerUser).mockRejectedValueOnce(new Error('network unavailable'))

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Registration failed')).toBeInTheDocument()
    expect(screen.getAllByText('Unable to create the account right now.')).not.toHaveLength(0)
  })

  it('clears a field server error after editing that field', async () => {
    const user = userEvent.setup()
    renderWithTheme(<RegistrationPage />)

    await fillValidForm(user)
    vi.mocked(registerUser).mockRejectedValueOnce({
      status: 400,
      title: 'Validation failed',
      detail: 'One or more fields are invalid.',
      fieldErrors: {
        email: 'Email address is already registered.',
        password: 'Use a password with at least 8 characters.',
      },
    })

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Validation failed')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('aria-invalid', 'true')

    await user.clear(screen.getByLabelText(/email address/i))
    await user.type(screen.getByLabelText(/email address/i), 'ava2@example.com')

    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).not.toHaveAttribute('aria-invalid', 'true')
    })
    expect(screen.queryByText('Email address is already registered.')).toBeNull()
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByText('Use a password with at least 8 characters.')).not.toHaveLength(0)
  })
})
