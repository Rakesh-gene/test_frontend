export const registrationRoutePath = '/register'

// Temporary frontend contract stub for the registration slice.
// The backend task owns the final DTO and route agreement; this file marks the
// assumed shape so the form and API layer have a single local source of truth.
export const registrationContract = {
  endpoint: '/api/user/register',
  method: 'POST',
  requestFields: ['fullName', 'email', 'password'],
  responseShape: {
    message: 'string',
    userId: 'string | number',
  },
}

