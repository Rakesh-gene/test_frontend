import { useMemo, useState } from 'react'
import { registerUser } from './services/registrationApi'
import './App.css'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

const initialTouched = {
  firstName: false,
  lastName: false,
  email: false,
  password: false,
}

function validateField(name, value) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return 'This field is required.'
  }

  if (name === 'email') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(trimmedValue)) {
      return 'Enter a valid email address.'
    }
  }

  if (name === 'password' && trimmedValue.length < 8) {
    return 'Use at least 8 characters.'
  }

  return ''
}

function validateForm(form) {
  return {
    firstName: validateField('firstName', form.firstName),
    lastName: validateField('lastName', form.lastName),
    email: validateField('email', form.email),
    password: validateField('password', form.password),
  }
}

function getServerMessage(payload, fallbackMessage) {
  if (!payload || typeof payload !== 'object') {
    return fallbackMessage
  }

  if (typeof payload.detail === 'string' && payload.detail.trim()) {
    return payload.detail
  }

  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message
  }

  if (Array.isArray(payload.errors)) {
    const firstMessage = payload.errors.find((item) => typeof item === 'string' && item.trim())
    if (firstMessage) {
      return firstMessage
    }
  }

  if (payload.errors && typeof payload.errors === 'object') {
    const firstEntry = Object.values(payload.errors)
      .flat()
      .find((item) => typeof item === 'string' && item.trim())

    if (firstEntry) {
      return firstEntry
    }
  }

  return fallbackMessage
}

function getCreatedUserLabel(user) {
  const firstName = typeof user?.firstName === 'string' ? user.firstName.trim() : ''
  const lastName = typeof user?.lastName === 'string' ? user.lastName.trim() : ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()

  return fullName || 'the new account'
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [touched, setTouched] = useState(initialTouched)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [status, setStatus] = useState('idle')
  const [serverMessage, setServerMessage] = useState('')
  const [createdUser, setCreatedUser] = useState(null)

  const fieldErrors = useMemo(() => validateForm(form), [form])
  const hasErrors = Object.values(fieldErrors).some(Boolean)

  const showFieldError = (name) => touched[name] || submitAttempted
  const canSubmit = status !== 'submitting'

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setServerMessage('')
    setCreatedUser(null)
    if (status === 'success') {
      setStatus('idle')
    }
  }

  function handleBlur(event) {
    const { name } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitAttempted(true)

    if (hasErrors) {
      setStatus('invalid')
      setServerMessage('Please fix the highlighted fields before continuing.')
      return
    }

    setStatus('submitting')
    setServerMessage('')
    setCreatedUser(null)

    try {
      const response = await registerUser(form)
      setCreatedUser(response.user ?? response)
      setStatus('success')
      setForm(initialForm)
      setTouched(initialTouched)
      setSubmitAttempted(false)
    } catch (error) {
      const responseStatus = error?.status
      const fallbackMessage =
        responseStatus === 409
          ? 'An account with this email already exists.'
          : responseStatus === 400
            ? 'The server rejected the registration details.'
            : 'Registration failed. Check the connection and try again.'

      setStatus('error')
      setServerMessage(getServerMessage(error?.data, fallbackMessage))
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-panel" aria-labelledby="registration-title">
        <div className="hero-copy">
          <p className="eyebrow">Account setup</p>
          <h1 id="registration-title">Create your user account</h1>
          <p className="lead">
            Register with the backend `POST /api/user/register` endpoint and keep the
            experience fast, explicit, and accessible.
          </p>

          <ul className="benefits" aria-label="Registration highlights">
            <li>Validated first name, last name, email, and password</li>
            <li>Clear loading, success, and server-error feedback</li>
            <li>Configurable API base URL through `VITE_API_BASE_URL`</li>
          </ul>
        </div>

        <div className="status-card" aria-live="polite">
          <p className="status-label">Current state</p>
          <p className={`status-value status-value--${status}`}>
            {status === 'idle' && 'Ready to register'}
            {status === 'invalid' && 'Fix validation errors'}
            {status === 'submitting' && 'Submitting registration'}
            {status === 'success' && 'Registration complete'}
            {status === 'error' && 'Registration failed'}
          </p>
          <p className="status-copy">
            The form remains fully usable while the backend contract stays narrow and explicit.
          </p>
        </div>
      </section>

      <section className="form-panel" aria-labelledby="registration-form-title">
        <div className="form-panel__header">
          <h2 id="registration-form-title">Registration details</h2>
          <p>Fields marked required are validated before any request is sent.</p>
        </div>

        {status === 'success' && createdUser && (
          <div className="alert alert--success" role="status">
            <strong>Account created.</strong> <span>Welcome, {getCreatedUserLabel(createdUser)}.</span>
            {createdUser.email && (
              <span className="alert__meta">Registered email: {createdUser.email}</span>
            )}
          </div>
        )}

        {serverMessage && status !== 'success' && (
          <div className="alert alert--error" role="alert">
            {serverMessage}
          </div>
        )}

        <form className="registration-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <FormField
              label="First name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={showFieldError('firstName') ? fieldErrors.firstName : ''}
              autoComplete="given-name"
              placeholder="Amina"
            />

            <FormField
              label="Last name"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={showFieldError('lastName') ? fieldErrors.lastName : ''}
              autoComplete="family-name"
              placeholder="Patel"
            />
          </div>

          <FormField
            label="Email address"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={showFieldError('email') ? fieldErrors.email : ''}
            autoComplete="email"
            placeholder="name@example.com"
            hint="Use the address that should own the new account."
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={showFieldError('password') ? fieldErrors.password : ''}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Choose a password with at least 8 characters."
          />

          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={!canSubmit}>
              {status === 'submitting' ? 'Creating account…' : 'Create account'}
            </button>
            <p className="form-footnote">
              The request is sent as JSON to the configured backend base URL.
            </p>
          </div>
        </form>
      </section>
    </main>
  )
}

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  autoComplete,
}) {
  const errorId = `${name}-error`
  const hintId = `${name}-hint`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <label className={`field ${error ? 'field--error' : ''}`} htmlFor={name}>
      <span className="field__label">
        {label}
        <span className="field__required" aria-hidden="true">
          *
        </span>
      </span>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {hint && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={errorId} role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

export default App
