import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '500px', margin: '40px auto', textAlign: 'center', backgroundColor: '#fefdfa', borderRadius: '24px', border: '1px solid #efdbc6' }}>
          <h2 style={{ color: '#8f3d42', fontSize: '20px', marginBottom: '12px' }}>Что-то пошло не так</h2>
          <p style={{ color: '#857e79', fontSize: '14px', marginBottom: '16px' }}>{this.state.error?.message || 'Произошла непредвиденная ошибка.'}</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            style={{ backgroundColor: '#8f3d42', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Перезагрузить приложение
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
