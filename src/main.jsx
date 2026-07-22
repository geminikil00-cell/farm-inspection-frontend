import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider, ROLES, useAuth } from './context/AuthContext'
import { SystemAdminApp } from './components/SystemAdminApp'
import { LoginPage } from './components/LoginPage'
import { LANGUAGES, UI_TRANSLATIONS } from './translations'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#c00' }}>
          <h1>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#666' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const { role, isAuthenticated } = useAuth();
  const isAdminPath = window.location.pathname.startsWith('/admin');
  const isAdmin = role === ROLES.SUPER_ADMIN || role === ROLES.ORG_ADMIN;

  if (!isAuthenticated) {
    const t = UI_TRANSLATIONS.en;
    return <LoginPage t={t} />;
  }

  if (isAdminPath && isAdmin) {
    return <SystemAdminApp />;
  }

  if (isAdminPath && !isAdmin) {
    window.location.href = '/';
    return null;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
