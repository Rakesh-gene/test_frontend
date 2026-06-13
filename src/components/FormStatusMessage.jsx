function FormStatusMessage({ variant, title, children }) {
  if (!variant) {
    return null
  }

  const isError = variant === 'error'

  return (
    <div
      className={`form-status form-status--${variant}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  )
}

export default FormStatusMessage
