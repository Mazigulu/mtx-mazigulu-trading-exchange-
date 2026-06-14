import * as React from 'react';
import { StrictMode, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
    (this as any).setState({ errorInfo });
  }

  public render() {
    if ((this as any).state.hasError) {
      return (
        <div style={{ padding: '30px', background: '#0a0a0f', color: '#f87171', fontFamily: 'monospace', minHeight: '100vh', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#ef4444' }}>🚨 React Runtime Crash Detected</h1>
          <p style={{ color: '#94a3b8', marginBottom: '20px' }}>An uncaught error has halted the React runtime. See diagnostics below:</p>
          <div style={{ background: '#020204', padding: '20px', borderRadius: '8px', overflowX: 'auto', border: '1px solid #ef4444', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.15)' }}>
            <strong>Error Message:</strong>
            <pre style={{ margin: '10px 0 20px 0', color: '#fca5a5', whiteSpace: 'pre-wrap', background: '#1c1917', padding: '10px', borderRadius: '4px' }}>{(this as any).state.error?.toString()}</pre>
            
            <strong>Stack Trace:</strong>
            <pre style={{ margin: '10px 0 20px 0', color: '#cbd5e1', fontSize: '12px', whiteSpace: 'pre-wrap', background: '#1c1917', padding: '10px', borderRadius: '4px' }}>{(this as any).state.error?.stack}</pre>
            
            {(this as any).state.errorInfo && (
              <>
                <strong>Component Stack:</strong>
                <pre style={{ margin: '10px 0 0 0', color: '#94a3b8', fontSize: '11px', whiteSpace: 'pre-wrap', background: '#1c1917', padding: '10px', borderRadius: '4px' }}>{(this as any).state.errorInfo.componentStack}</pre>
              </>
            )}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '12px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
