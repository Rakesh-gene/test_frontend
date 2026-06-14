import {
  getSubmissionMessage,
  validateRegistration,
} from '../registrationState.js'

describe('registrationState', () => {
  it('validates required and format rules', () => {
    expect(validateRegistration({
      firstName: '',
      lastName: '',
      email: 'not-an-email',
      password: 'short',
    })).toEqual({
      firstName: 'First name is required.',
      lastName: 'Last name is required.',
      email: 'Enter a valid email address.',
      password: 'Use at least 8 characters.',
    })
  })

  it('accepts trimmed valid values', () => {
    expect(validateRegistration({
      firstName: ' Ava ',
      lastName: ' Johnson ',
      email: 'ava@example.com',
      password: 'correcthorsebattery',
    })).toEqual({})
  })

  it('describes submission states', () => {
    expect(getSubmissionMessage({ status: 'idle', title: '', detail: '' }, null, false)).toEqual({
      severity: 'info',
      title: 'Form requirements',
      message: 'All fields are required. Use a valid email address and a password with at least 8 characters.',
    })

    expect(getSubmissionMessage({ status: 'submitting', title: '', detail: '' }, null, false)).toEqual({
      severity: 'info',
      title: 'Submitting registration',
      message: 'Sending the registration details to the backend.',
    })
  })
})
