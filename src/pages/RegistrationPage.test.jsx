import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RegistrationPage from './RegistrationPage.jsx'
import { registerUser } from '../api/registrationApi.js'

vi.mock('../api/registrationApi.js', () => ({
  registerUser: vi.fn(),
}))

const mockedRegisterUser = vi.mocked(registerUser)

function renderPage() {
  return render(<RegistrationPage />)
}

async function fillValidForm(user) {
  await user.type(screen.getByLabelText(/first name/i), 'Avery')
  await user.type(screen.getByLabelText(/last name/i), 'Johnson')
  await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
  await user.type(screen.getByLabelText(/^password$/i), 'supersecret')
  await user.type(screen.getByLabelText(/confirm password/i), 'supersecret')
}

beforeEach(() => {
  mockedRegisterUser.mockReset()
})

describe('RegistrationPage', () => {
  it('renders the registration form shell', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: /create your user profile/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeEnabled()
  })

  it('shows validation errors and prevents submission when required fields are missing', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText('First name is required.')).toBeInTheDocument()
    expect(screen.getByText('Last name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email address is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(screen.getByText('Please confirm your password.')).toBeInTheDocument()
    expect(mockedRegisterUser).not.toHaveBeenCalled()
  })

  it('submits a valid registration and shows success feedback', async () => {
    const user = userEvent.setup()
    mockedRegisterUser.mockResolvedValueOnce({
      id: 42,
      firstName: 'Avery',
      lastName: 'Johnson',
      email: 'avery@example.com',
      createdAtUtc: '2026-06-13T00:00:00Z',
    })

    renderPage()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockedRegisterUser).toHaveBeenCalledWith({
        firstName: 'Avery',
        lastName: 'Johnson',
        email: 'avery@example.com',
        password: 'supersecret',
      })
    })

    expect(await screen.findByRole('status')).toHaveTextContent('Account created successfully.')
    expect(screen.getByRole('button', { name: /create another account/i })).toBeEnabled()
    expect(screen.getByLabelText(/first name/i)).toHaveValue('')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('')
    expect(screen.getByLabelText(/email address/i)).toHaveValue('')
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('')
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('')
  })

  it('surfaces server failures and preserves the entered values', async () => {
    const user = userEvent.setup()
    mockedRegisterUser.mockRejectedValueOnce({
      detail: 'Registration failed. Please try again.',
      errors: {
        Email: ['Use another email address.'],
      },
    })

    renderPage()
    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(mockedRegisterUser).toHaveBeenCalledTimes(1)
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not create the account.')
    expect(screen.getByText('Use another email address.')).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Avery')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Johnson')
    expect(screen.getByLabelText(/email address/i)).toHaveValue('avery@example.com')
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('supersecret')
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('supersecret')
  })
})
