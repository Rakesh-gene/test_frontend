import { useState } from 'react'
import { APP_ROUTES } from '../routes.js'
import { registerUser } from '../api/registrationApi.js'
import FormStatusMessage from '../components/FormStatusMessage.jsx'
import {
  getRegistrationFeedbackMessage,
  normalizeServerFieldErrors,
  validateRegistrationForm,
} from '../utils/registrationValidation.js'
import '../App.css'

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

const fieldGroups = [
  {
    legend: 'Profile details',
    description:
      'These values identify the new account and will map directly to the registration payload.',
    fields: [
      {
        id: 'firstName',
        name: 'firstName',
        label: 'First name',
        type: 'text',
        autoComplete: 'given-name',
        placeholder: 'Avery',
      },
      {
        id: 'lastName',
        name: 'lastName',
        label: 'Last name',
        type: 'text',
        autoComplete: 'family-name',
        placeholder: 'Johnson',
      },
      {
        id: 'email',
        name: 'email',
        label: 'Email address',
        type: 'email',
        autoComplete: 'email',
        placeholder: 'avery@company.com',
        width: 'full',
      },
    ],
  },
  {
    legend: 'Security',
    description:
      'Use a password the backend can persist as part of the registration request.',
    fields: [
      {
        id: 'password',
        name: 'password',
        label: 'Password',
        type: 'password',
        autoComplete: 'new-password',
        placeholder: 'Create a password',
        width: 'full',
        hint: 'Use at least 8 characters.',
      },
      {
        id: 'confirmPassword',
        name: 'confirmPassword',
        label: 'Confirm password',
        type: 'password',
        autoComplete: 'new-password',
        placeholder: 'Repeat your password',
        width: 'full',
        hint: 'Must match the password above.',
      },
    ],
  },
]

function RegistrationPage() {
  const [formData, setFormData] = useState(initialFormState)
  const [touchedFields, setTouchedFields] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [feedbackState, setFeedbackState] = useState(null)
  const [serverFieldErrors, setServerFieldErrors] = useState({})

  const formErrors = validateRegistrationForm(formData)
  const hasFormErrors = Object.keys(formErrors).length > 0
  const hasServerFieldErrors = Object.keys(serverFieldErrors).length > 0
  const visibleFieldErrors = Object.entries(formErrors).reduce((accumulator, [field, message]) => {
    if (submitAttempted || touchedFields[field]) {
      accumulator[field] = message
    }

    return accumulator
  }, { ...serverFieldErrors })
  const canSubmit = !isSubmitting && (!submitAttempted || (!hasFormErrors && !hasServerFieldErrors))
  const isSuccess = feedbackState?.variant === 'success'

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))

    if (feedbackState) {
      setFeedbackState(null)
    }

    if (serverFieldErrors[name]) {
      setServerFieldErrors((current) => {
        const nextErrors = { ...current }
        delete nextErrors[name]
        return nextErrors
      })
    }
  }

  const handleBlur = (event) => {
    const { name } = event.target

    setTouchedFields((current) => ({
      ...current,
      [name]: true,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setSubmitAttempted(true)

    if (hasFormErrors) {
      setFeedbackState({
        variant: 'error',
        title: 'Check the form for missing or invalid values.',
        message: 'The account cannot be created until every required field is valid.',
      })
      return
    }

    setIsSubmitting(true)
    setFeedbackState({
      variant: 'info',
      title: 'Creating account',
      message: 'Submitting the registration details now.',
    })
    setServerFieldErrors({})

    try {
      await registerUser({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      })

      setFormData(initialFormState)
      setTouchedFields({})
      setSubmitAttempted(false)
      setFeedbackState({
        variant: 'success',
        title: 'Account created successfully.',
        message: 'The registration details were accepted and saved.',
      })
    } catch (error) {
      const typedError = /** @type {{ errors?: Record<string, string[]> }} */ (error)
      setServerFieldErrors(normalizeServerFieldErrors(typedError.errors))
      setFeedbackState({
        variant: 'error',
        title: 'We could not create the account.',
        message: getRegistrationFeedbackMessage(error),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="registration-page" data-route={APP_ROUTES.registration}>
      <section className="registration-shell" aria-labelledby="registration-title">
        <aside className="registration-aside">
          <div className="brand-mark" aria-hidden="true">
            RG
          </div>
          <p className="eyebrow">Account setup</p>
          <h1 id="registration-title">Create your user profile</h1>
          <p className="lead">
            Set up the registration screen now so the backend contract can be wired into
            a production-ready form without changing the page structure later.
          </p>

          <ul className="benefits" aria-label="Registration benefits">
            <li>Clear field labels and sectioning for API mapping</li>
            <li>Controlled inputs ready for typed submission payloads</li>
            <li>Accessible layout that works on desktop and mobile</li>
          </ul>

          <div className="status-card" aria-label="Form readiness">
            <span className="status-dot" aria-hidden="true" />
            <div>
              <strong>Ready for account creation</strong>
              <p>The registration screen captures the fields needed for a user profile.</p>
            </div>
          </div>
        </aside>

        <section className="registration-card" aria-labelledby="form-title">
          <div className="card-header">
            <div>
              <p className="card-kicker">New account</p>
              <h2 id="form-title">Registration details</h2>
            </div>
            <p className="card-copy">
              Fill in the form below to create a new user profile.
            </p>
          </div>

          <form className="registration-form" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <FormStatusMessage
              variant={feedbackState?.variant}
              title={feedbackState?.title}
            >
              {feedbackState?.message}
            </FormStatusMessage>

            {fieldGroups.map((group) => (
              <fieldset key={group.legend} className="field-group">
                <legend>{group.legend}</legend>
                <p className="group-copy">{group.description}</p>

                <div className="field-grid">
                  {group.fields.map((field) => (
                    <div
                      key={field.id}
                      className={`field ${field.width === 'full' ? 'field--full' : ''}`.trim()}
                    >
                      <label className="field-label" htmlFor={field.id}>
                        {field.label}
                        <span className="required-mark" aria-hidden="true">
                          *
                        </span>
                      </label>
                      <input
                        id={field.id}
                        name={field.name}
                        type={field.type}
                        autoComplete={field.autoComplete}
                        placeholder={field.placeholder}
                        value={formData[field.name]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={Boolean(visibleFieldErrors[field.name])}
                        aria-describedby={[
                          field.hint ? `${field.id}-hint` : null,
                          visibleFieldErrors[field.name] ? `${field.id}-error` : null,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        required
                        disabled={isSubmitting}
                      />
                      {field.hint ? (
                        <p className="field-help" id={`${field.id}-hint`}>
                          {field.hint}
                        </p>
                      ) : null}
                      {visibleFieldErrors[field.name] ? (
                        <p className="field-error" id={`${field.id}-error`} role="alert">
                          {visibleFieldErrors[field.name]}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}

            <div className="form-footer">
              <p className="footer-copy">
                {isSuccess
                  ? 'The account is ready. You can submit another registration if needed.'
                  : 'Review the details before creating the account.'}
              </p>
              <button type="submit" className="submit-button" disabled={!canSubmit}>
                {isSubmitting ? 'Creating account...' : isSuccess ? 'Create another account' : 'Create account'}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  )
}

export default RegistrationPage
