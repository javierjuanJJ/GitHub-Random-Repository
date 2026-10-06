import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled render error', error, info.componentStack)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="app-container">
        <div className="state-box state-error" role="alert">
          <p className="state-message">{this.state.message}</p>
          <button type="button" className="retry-button" onClick={this.handleReload}>
            Reload the page
          </button>
        </div>
      </div>
    )
  }
}
