# Registration Slice Notes

This folder is the planned home for the registration flow.

- Page shell: `src/features/registration/RegistrationPage.jsx`
- Form component: `src/features/registration/RegistrationForm.jsx`
- API client: `src/features/registration/api.js`
- Shared contract: `src/features/registration/contract.js`

Current frontend assumption for the backend handoff:

- Route: `POST /api/user/register`
- Payload fields: `fullName`, `email`, `password`
- Success response: a small created-record acknowledgement with a message and `userId`

This is a temporary contract stub for A1-T1 and should be reconciled with the backend DTO before the submit flow is implemented.
