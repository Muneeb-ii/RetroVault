import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Tool Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <div className="text-center font-bold text-lg mb-4 text-red-600">
            ❌ Tool Error
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Something went wrong with this tool. Please try again.
          </div>
          <div className="text-xs text-gray-500 mb-4">
            Error: {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            className="retro-button px-4 py-2"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            🔄 Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
