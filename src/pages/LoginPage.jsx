import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Wallet, ArrowRight } from 'lucide-react'
import './LoginPage.css'

export default function LoginPage() {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState(0) // 0=splash, 1=form
  const [nameError, setNameError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setNameError(true)
      return
    }
    login(name.trim(), email.trim())
  }

  if (step === 0) {
    return (
      <div className="login-page">
        <div className="login-splash">
          <div className="login-logo animate-bounce-in">
            <div className="login-logo-icon">
              <Wallet size={40} strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="login-title animate-fade-in-up">FinFlow</h1>
          <p className="login-subtitle animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Seu gerenciamento financeiro<br />simples e inteligente
          </p>
          <div className="login-features stagger">
            <div className="login-feature">
              <span className="login-feature-emoji">📊</span>
              <span>Controle total dos seus gastos</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-emoji">🏦</span>
              <span>Conecte seus bancos</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-emoji">🎯</span>
              <span>Metas e categorias personalizadas</span>
            </div>
          </div>
          <button className="login-cta" onClick={() => setStep(1)} id="btn-start">
            <span>Começar agora</span>
            <ArrowRight size={20} />
          </button>
        </div>
        <div className="login-bg-decoration">
          <div className="login-circle login-circle-1" />
          <div className="login-circle login-circle-2" />
          <div className="login-circle login-circle-3" />
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-form-container animate-fade-in-up">
        <button className="login-back" onClick={() => setStep(0)}>
          ← Voltar
        </button>
        <div className="login-form-header">
          <div className="login-logo-small">
            <Wallet size={24} strokeWidth={1.5} />
          </div>
          <h2>Crie sua conta</h2>
          <p>Preencha seus dados para começar</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-name">Seu nome</label>
            <input
              id="login-name"
              type="text"
              placeholder="Como podemos te chamar?"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(false) }}
              autoFocus
              required
              style={nameError ? { borderColor: 'var(--danger-500)', boxShadow: '0 0 0 3px rgba(255,107,107,0.15)' } : {}}
            />
            {nameError && <span style={{ color: 'var(--danger-500)', fontSize: 'var(--font-xs)', marginTop: '4px' }}>Por favor, digite seu nome</span>}
          </div>
          <div className="form-group">
            <label htmlFor="login-email">E-mail (opcional)</label>
            <input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <button type="submit" className="login-submit" disabled={!name.trim()} id="btn-login">
            <span>Entrar no FinFlow</span>
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
      <div className="login-bg-decoration">
        <div className="login-circle login-circle-1" />
        <div className="login-circle login-circle-2" />
      </div>
    </div>
  )
}
