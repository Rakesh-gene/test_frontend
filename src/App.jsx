import { useState } from 'react'
import './App.css'

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

function App() {
  const [form, setForm] = useState(initialFormState)
  const [status, setStatus] = useState({
    tone: 'idle',
    message: 'Complete the form below to prepare a registration request.',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    setStatus({
      tone: 'success',
      message:
        'Registration details captured locally. Backend submission will be connected in the next step.',
    })
  }

  const isSubmitDisabled = Object.values(form).some((value) => value.trim() === '')

  return (
    <main className="registration-page">
      <section className="registration-shell" aria-labelledby="registration-title">
        <div className="registration-copy">
          <span className="eyebrow">User registration</span>
          <h1 id="registration-title">Create an account</h1>
          <p className="lead">
            A focused registration flow ready for backend integration. The form is
            keyboard-friendly, responsive, and keeps its own local state.
          </p>
        </div>

        <div className="registration-card">
          <form className="registration-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Alex"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Morgan"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="alex@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a secure password"
                required
              />
            </div>

            <div className="form-footer">
              <button type="submit" disabled={isSubmitDisabled}>
                Prepare registration
              </button>
              <p className="supporting-copy">
                No network call happens yet. This task establishes the UI shell and
                local interaction state.
              </p>
            </div>

            <div
              className={`status status--${status.tone}`}
              role="status"
              aria-live="polite"
            >
              {status.message}
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

export default App
