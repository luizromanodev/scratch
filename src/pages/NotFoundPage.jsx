import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '24px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '360px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}>
        <span style={{ fontSize: '4rem', lineHeight: 1 }}>🗺️</span>
        <h1 style={{
          fontSize: '5rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-300))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          lineHeight: 1,
        }}>
          404
        </h1>
        <p style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          Página não encontrada
        </p>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          margin: 0,
        }}>
          A página que você procura não existe ou foi movida.
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          marginTop: '16px',
          width: '100%',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--card-border)',
              borderRadius: '14px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
          <button
            onClick={() => navigate('/')}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
              color: 'white',
              border: 'none',
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
      </div>
    </div>
  )
}
