import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-6">
          <div className="max-w-xl w-full rounded-3xl border border-red-500/30 bg-gray-900/95 p-8 shadow-2xl shadow-red-500/10 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-sm text-gray-300 mb-6">
              The application encountered an unexpected error. Please reload the page or contact support if this keeps happening.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="py-3 px-6 bg-cyan-500 text-gray-950 font-semibold uppercase tracking-[0.2em] rounded-md hover:bg-cyan-400 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
