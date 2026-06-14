import { createRegistrationError } from '../../../api/registrationApi.js'

describe('registrationApi error mapping', () => {
  it('maps validation payloads to normalized field errors', () => {
    const error = createRegistrationError(
      { status: 400 },
      {
        title: 'Validation failed',
        detail: 'Review the form.',
        errors: {
          'request.firstName': ['First name is required.'],
          'request.email': ['Email address is invalid.'],
          password: ['Password is too short.'],
        },
      },
    )

    expect(error).toEqual({
      status: 400,
      title: 'Validation failed',
      detail: 'Review the form.',
      fieldErrors: {
        firstName: 'First name is required.',
        email: 'Email address is invalid.',
        password: 'Password is too short.',
      },
    })
  })

  it('maps duplicate email conflicts to a field-level email error', () => {
    const error = createRegistrationError(
      { status: 409 },
      {
        detail: 'That email is already registered.',
      },
    )

    expect(error).toEqual({
      status: 409,
      title: 'Email already in use',
      detail: 'That email is already registered.',
      fieldErrors: {
        email: 'That email is already registered.',
      },
    })
  })

  it('falls back to a safe generic failure shape', () => {
    const error = createRegistrationError({ status: 500 }, null)

    expect(error).toEqual({
      status: 500,
      title: 'Registration failed',
      detail: 'Unable to create the account right now.',
      fieldErrors: {},
    })
  })
})
