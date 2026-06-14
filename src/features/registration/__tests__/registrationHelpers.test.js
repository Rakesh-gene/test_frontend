import { describe, expect, it } from 'vitest'
import {
  createRegistrationError,
  getSubmissionMessage,
  validateRegistration,
} from '../registrationHelpers.js'

describe('registrationHelpers', () => {
  it('validates required and format rules', () => {
    expect(
      validateRegistration({
        firstName: '',
        lastName: '',
        email: 'bad-email',
        password: 'short',
      }),
    ).toEqual({
      firstName: 'First name is required.',
      lastName: 'Last name is required.',
      email: 'Enter a valid email address.',
      password: 'Use at least 8 characters.',
    })
  })

  it('returns the default informational message before submission', () => {
    expect(getSubmissionMessage({ status: 'idle' }, null, false)).toEqual({
      severity: 'info',
      title: 'Form requirements',
      message:
        'All fields are required. Use a valid email address and a password with at least 8 characters.',
    })
  })

  it('maps submission errors from the problem payload', () => {
    expect(
      createRegistrationError(
        { status: 400 },
        {
          title: 'Validation failed',
          detail: 'Check the form.',
          errors: {
            'request.FirstName': ['First name is required.'],
            Email: ['Enter a valid email address.'],
          },
        },
      ),
    ).toEqual({
      status: 400,
      title: 'Validation failed',
      detail: 'Check the form.',
      fieldErrors: {
        firstName: 'First name is required.',
        email: 'Enter a valid email address.',
      },
    })
  })

  it('promotes duplicate email conflicts to the email field', () => {
    expect(
      createRegistrationError(
        { status: 409 },
        {
          title: 'Duplicate email',
          detail: 'A user with that email already exists.',
        },
      ),
    ).toEqual({
      status: 409,
      title: 'Duplicate email',
      detail: 'A user with that email already exists.',
      fieldErrors: {
        email: 'A user with that email already exists.',
      },
    })
  })
})
