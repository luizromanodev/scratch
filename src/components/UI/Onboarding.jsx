import { useState } from 'react'
import { Wallet, ArrowRight, BarChart3, PieChart, Target, Sparkles } from 'lucide-react'
import './Onboarding.css'

const slides = [
  {
    emoji: '👋',
    title: 'Bem-vindo ao FinFlow!',
    description: 'Seu gerenciamento financeiro pessoal, simples e inteligente.',
    icon: Wallet,
    color: '#6C5CE7',
  },
  {
    emoji: '📝',
    title: 'Registre seus gastos',
    description: 'Adicione receitas e despesas com categorias, datas e até parcelamento. Use o botão + na barra inferior.',
    icon: BarChart3,
    color: '#00D09C',
  },
  {
    emoji: '📊',
    title: 'Defina orçamentos',
    description: 'Crie limites para cada categoria e receba alertas quando estiver perto de estourar.',
    icon: PieChart,
    color: '#FF6B6B',
  },
  {
    emoji: '🎯',
    title: 'Alcance suas metas',
    description: 'Crie cofres para guardar dinheiro para viagens, emergências ou o que quiser.',
    icon: Target,
    color: '#FDCB6E',
  },
  {
    emoji: '✨',
    title: 'FinBot — Seu assistente IA',
    description: 'Peça análises, relatórios e dicas personalizadas sobre suas finanças. Acesse pelo Dashboard.',
    icon: Sparkles,
    color: '#A29BFE',
  },
]

// Onboarding key is scoped per user to ensure every new user sees the tour
function getOnboardingKey(userId) {
  return `finflow_onboarding_done_${userId || 'guest'}`
}

export function isOnboardingDone(userId) {
  return localStorage.getItem(getOnboardingKey(userId)) === 'true'
}

export default function Onboarding({ onComplete, userId }) {
  const [current, setCurrent] = useState(0)

  const isLast = current === slides.length - 1
  const slide = slides[current]

  const markDone = () => {
    localStorage.setItem(getOnboardingKey(userId), 'true')
    onComplete()
  }

  const handleNext = () => {
    if (isLast) {
      markDone()
    } else {
      setCurrent(c => c + 1)
    }
  }

  return (
    <div className="onboarding">
      <div className="onb-bg-decoration">
        <div className="onb-circle onb-circle-1" style={{ background: slide.color + '15' }} />
        <div className="onb-circle onb-circle-2" style={{ background: slide.color + '10' }} />
      </div>

      <button className="onb-skip" onClick={markDone}>
        Pular
      </button>

      <div className="onb-content animate-fade-in" key={current}>
        <div className="onb-icon-wrapper" style={{ background: slide.color + '12' }}>
          <span className="onb-emoji">{slide.emoji}</span>
        </div>

        <h1 className="onb-title">{slide.title}</h1>
        <p className="onb-description">{slide.description}</p>
      </div>

      <div className="onb-footer">
        {/* Dots */}
        <div className="onb-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`onb-dot ${i === current ? 'active' : ''} ${i < current ? 'done' : ''}`}
              onClick={() => setCurrent(i)}
              style={i === current ? { background: slide.color } : {}}
            />
          ))}
        </div>

        <button className="onb-next" onClick={handleNext} style={{ background: slide.color }}>
          <span>{isLast ? 'Começar!' : 'Próximo'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
