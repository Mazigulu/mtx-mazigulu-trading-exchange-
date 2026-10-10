import * as React from 'react';
import { StrictMode, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully handle AbortError, web3, MetaMask, or background promise rejections
const isIgnorableError = (err: any): boolean => {
  if (!err) return false;
  const name = err?.name || '';
  const message = err?.message || String(err || '');
  const text = (name + ' ' + message).toLowerCase();
  return (
    name === 'AbortError' ||
    text.includes('aborterror') ||
    text.includes('the user aborted a request') ||
    text.includes('signal is aborted') ||
    text.includes('aborted without reason') ||
    text.includes('operation was aborted') ||
    text.includes('metamask') || 
    text.includes('ethereum') || 
    text.includes('wallet') || 
    text.includes('web3') ||
    text.includes('provider') ||
    text.includes('failed to connect') ||
    text.includes('user rejected')
  );
};

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (isIgnorableError(event.reason)) {
      console.warn('Intercepted and secured background rejection gracefully:', event.reason);
      try {
        event.preventDefault();
        event.stopImmediatePropagation();
      } catch (_e) {}
    }
  }, true);

  window.addEventListener('error', (event) => {
    if (isIgnorableError(event.error) || isIgnorableError(event.message)) {
      console.warn('Intercepted and secured global error report gracefully:', event.error || event.message);
      try {
        event.preventDefault();
        event.stopImmediatePropagation();
      } catch (_e) {}
    }
  }, true);
}

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
    if (this.state.hasError) {
      if (isIgnorableError(this.state.error)) {
        console.warn('Recovered from AbortError/Network signal in ErrorBoundary:', this.state.error);
        return (this as any).props.children;
      }
      const errMessage = (this.state.error?.toString() || '').toLowerCase();
      if (
        errMessage.includes('metamask') ||
        errMessage.includes('ethereum') ||
        errMessage.includes('failed to connect') ||
        errMessage.includes('provider') ||
        errMessage.includes('user rejected')
      ) {
        console.warn('Recovered from web3 extension error in ErrorBoundary:', this.state.error);
        return (
          <div className="min-h-screen bg-[#060608] text-white flex flex-col items-center justify-center p-6 text-center font-mono">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-md w-full space-y-4">
              <h2 className="text-sm font-bold text-amber-400 uppercase">Web3 Handshake Recovered</h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                An external browser wallet signal was intercepted cleanly. Your session is safe.
              </p>
              <button
                type="button"
                onClick={() => (this as any).setState({ hasError: false, error: null, errorInfo: null })}
                className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase rounded transition-colors cursor-pointer"
              >
                Resume Terminal
              </button>
            </div>
          </div>
        );
      }

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
