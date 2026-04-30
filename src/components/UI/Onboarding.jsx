import { useState } from 'react'
import { Wallet, ArrowRight, BarChart3, PieChart, Target } from 'lucide-react'
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
    description: 'Adicione receitas e despesas com categorias, datas e até parcelamento.',
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
]

export default function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0)

  const isLast = current === slides.length - 1
  const slide = slides[current]

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('finflow_onboarding_done', 'true')
      onComplete()
    } else {
      setCurrent(c => c + 1)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('finflow_onboarding_done', 'true')
    onComplete()
  }

  return (
    <div className="onboarding">
      <div className="onb-bg-decoration">
        <div className="onb-circle onb-circle-1" style={{ background: slide.color + '15' }} />
        <div className="onb-circle onb-circle-2" style={{ background: slide.color + '10' }} />
      </div>

      <button className="onb-skip" onClick={handleSkip}>
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
