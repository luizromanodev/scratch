import { useState, useMemo } from 'react'
import { Lightbulb, X } from 'lucide-react'
import './DailyTip.css'

const TIPS = [
  { emoji: '💡', text: 'Tente a regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança.' },
  { emoji: '🎯', text: 'Defina metas financeiras claras. Elas ajudam a manter o foco.' },
  { emoji: '📊', text: 'Revise seus gastos semanalmente para evitar surpresas no fim do mês.' },
  { emoji: '💳', text: 'Pague a fatura do cartão em dia para evitar juros altíssimos.' },
  { emoji: '🏦', text: 'Tenha uma reserva de emergência de pelo menos 6 meses de despesas.' },
  { emoji: '📝', text: 'Registre cada gasto, mesmo os pequenos. Eles somam rápido!' },
  { emoji: '🔄', text: 'Revise suas assinaturas mensais. Cancele o que não usa.' },
  { emoji: '🛒', text: 'Faça uma lista antes de ir ao mercado. Evite compras por impulso.' },
  { emoji: '💰', text: 'Automatize sua poupança. Separe um valor fixo logo que receber.' },
  { emoji: '📈', text: 'Investir é diferente de gastar. Comece com pouco, mas comece.' },
  { emoji: '🎁', text: 'Presenteie com experiências, não só objetos. Costumam custar menos.' },
  { emoji: '☕', text: 'Cafés fora custam ~R$ 150/mês. Considere levar de casa.' },
  { emoji: '🏠', text: 'Moradia não deve passar de 30% da renda. Repense se estiver acima.' },
  { emoji: '📱', text: 'Compare planos de celular/internet. Você pode estar pagando caro.' },
]

export default function DailyTip() {
  const [dismissed, setDismissed] = useState(() => {
    const saved = localStorage.getItem('finflow_tip_dismissed')
    if (!saved) return false
    // Reset daily
    const today = new Date().toISOString().slice(0, 10)
    return saved === today
  })

  const tip = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    return TIPS[dayOfYear % TIPS.length]
  }, [])

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('finflow_tip_dismissed', new Date().toISOString().slice(0, 10))
  }

  return (
    <div className="daily-tip animate-fade-in-up">
      <span className="daily-tip-emoji">{tip.emoji}</span>
      <p className="daily-tip-text">{tip.text}</p>
      <button className="daily-tip-close" onClick={handleDismiss} aria-label="Fechar dica">
        <X size={14} />
      </button>
    </div>
  )
}
