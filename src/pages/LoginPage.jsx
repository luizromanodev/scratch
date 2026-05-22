import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Wallet, ArrowRight } from 'lucide-react'
import './LoginPage.css'

export default function LoginPage() {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState(0) // 0=splash, 1=form
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    const trimmedName = name.trim()

    if (!trimmedName) {
      newErrors.name = 'Por favor, digite seu nome'
    } else if (trimmedName.length < 2) {
      newErrors.name = 'O nome deve ter pelo menos 2 caracteres'
    } else if (trimmedName.length > 50) {
      newErrors.name = 'O nome deve ter no máximo 50 caracteres'
    }

    const trimmedEmail = email.trim()
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Digite um e-mail válido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateForm()) return
    login(name.trim(), email.trim())
  }

  const isFormValid = name.trim().length >= 2

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
        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="login-name">Seu nome *</label>
            <input
              id="login-name"
              type="text"
              placeholder="Como podemos te chamar?"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(prev => ({ ...prev, name: undefined })) }}
              autoFocus
              maxLength={50}
              style={errors.name ? { borderColor: 'var(--danger-500)', boxShadow: '0 0 0 3px rgba(255,107,107,0.15)' } : {}}
            />
            {errors.name && <span className="login-field-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="login-email">E-mail (opcional)</label>
            <input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })) }}
              style={errors.email ? { borderColor: 'var(--danger-500)', boxShadow: '0 0 0 3px rgba(255,107,107,0.15)' } : {}}
            />
            {errors.email && <span className="login-field-error">{errors.email}</span>}
            <span className="login-field-hint">Usar o mesmo e-mail restaura seus dados em qualquer dispositivo</span>
          </div>
          <button type="submit" className="login-submit" disabled={!isFormValid} id="btn-login">
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
