import { Component } from 'react'
import { Wallet, RefreshCw, Home } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('FinFlow Error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #0F0F14)',
          color: 'var(--text-primary, #E8E6F0)',
          padding: '24px',
          fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '22px',
              background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 8px 30px rgba(108, 92, 231, 0.35)',
              marginBottom: '8px',
            }}>
              <Wallet size={32} />
            </div>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: 0,
            }}>
              Ops! Algo deu errado
            </h1>

            <p style={{
              color: 'var(--text-secondary, #9B97B0)',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              margin: 0,
            }}>
              O FinFlow encontrou um erro inesperado. Seus dados estão seguros — tente recarregar a página.
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '8px',
              width: '100%',
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #6C5CE7, #5A4BD1)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <RefreshCw size={18} />
                Recarregar
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '14px',
                  background: 'var(--bg-tertiary, #1E1E2A)',
                  color: 'var(--text-primary, #E8E6F0)',
                  border: '1px solid var(--card-border, #2A2A3C)',
                  borderRadius: '14px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <Home size={18} />
                Início
              </button>
            </div>

            {this.state.error && (
              <details style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--bg-tertiary, #1E1E2A)',
                borderRadius: '12px',
                width: '100%',
                textAlign: 'left',
                fontSize: '0.75rem',
                color: 'var(--text-tertiary, #6B6880)',
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Detalhes técnicos</summary>
                <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {this.state.error.toString()}
                </code>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
