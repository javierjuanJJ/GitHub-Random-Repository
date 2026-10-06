interface StateDisplayProps {
  type: 'empty' | 'loading' | 'error'
  message: string
  onRetry?: () => void
}

export function StateDisplay({ type, message, onRetry }: StateDisplayProps) {
  if (type === 'error') {
    return (
      <div className="state-box state-error" role="alert">
        <p className="state-message">{message}</p>
        {onRetry ? (
          <button type="button" className="retry-button" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    )
  }

  if (type === 'loading') {
    return (
      <div className="state-box state-loading" role="status">
        <span className="spinner" aria-hidden="true" />
        <p className="state-message">{message}</p>
      </div>
    )
  }

  return (
    <div className="state-box state-empty">
      <p className="state-message">{message}</p>
    </div>
  )
}
