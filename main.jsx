import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', { style: { padding: 20, background: '#050A14', minHeight: '100vh', color: '#E8EDF5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' } },
        React.createElement('div', { style: { fontSize: 48, marginBottom: 16 } }, '⚠️'),
        React.createElement('div', { style: { fontSize: 18, color: '#FF4757', marginBottom: 8 } }, 'Failed to load'),
        React.createElement('button', { onClick: () => window.location.reload(), style: { padding: '12px 24px', background: '#FFD700', color: '#050A14', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' } }, 'Reload')
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(ErrorBoundary, null, React.createElement(App))
)
