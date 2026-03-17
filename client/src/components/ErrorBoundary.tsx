import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Log to localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error?.toString(),
        errorStack: error?.stack,
        componentStack: errorInfo?.componentStack
      };
      localStorage.setItem('lastError', JSON.stringify(errorLog));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', padding: 24 }}>
          <h2>Something went wrong.</h2>
          <pre>{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children; // This line remains unchanged
  }
}
export default ErrorBoundary;