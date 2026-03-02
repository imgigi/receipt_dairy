
import * as React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Define explicit interfaces for Props and State
interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary Component
// Use class property initializer for state to avoid type inference issues within the constructor.
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#333' }}>
          <h1 style={{ color: '#e11d48' }}>Something went wrong.</h1>
          <p>应用遇到严重错误，无法显示。</p>
          <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', overflow: 'auto', marginTop: '1rem' }}>
             <p style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{this.state.error?.message}</p>
             <p style={{ fontSize: '0.8rem', color: '#666' }}>Check the console for more details.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#333', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
