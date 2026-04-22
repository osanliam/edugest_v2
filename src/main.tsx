import {StrictMode, Component} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{children: React.ReactNode}, {error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0f172a', color: '#f8fafc',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '2rem', fontFamily: 'monospace'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚨</div>
          <h1 style={{ color: '#f87171', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Error de aplicación</h1>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>{this.state.error.message}</p>
          <pre style={{
            background: '#1e293b', padding: '1rem', borderRadius: '0.5rem',
            color: '#cbd5e1', fontSize: '0.75rem', maxWidth: '100%', overflow: 'auto',
            maxHeight: '300px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
          }}>{this.state.error.stack}</pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem', padding: '0.75rem 2rem',
              background: '#7c3aed', color: 'white', border: 'none',
              borderRadius: '0.5rem', cursor: 'pointer', fontSize: '1rem'
            }}>
            Recargar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
