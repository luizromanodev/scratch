import { useMemo } from 'react'
import { useFinance } from '../../context/FinanceContext'
import './HealthScore.css'

export default function HealthScore({ month, year }) {
  const { getBalance, budgets, getExpensesByCategory, goals } = useFinance()

  const { score, label, color, factors } = useMemo(() => {
    const balance = getBalance(month, year)
    let s = 50 // Start at 50
    const f = []

    // Factor 1: Saving rate (0-25 points)
    if (balance.income > 0) {
      const savingRate = (balance.income - balance.expense) / balance.income
      const savingPts = Math.max(0, Math.min(25, savingRate * 100))
      s += savingPts - 12.5
      f.push({ name: 'Taxa de economia', value: `${Math.round(savingRate * 100)}%`, good: savingRate >= 0.1 })
    }

    // Factor 2: Budget compliance (0-25 points)
    if (budgets.length > 0) {
      const expenses = getExpensesByCategory(month, year)
      let compliant = 0
      budgets.forEach(b => {
        const exp = expenses.find(e => e.categoryId === b.categoryId)
        if (!exp || exp.amount <= b.limit) compliant++
      })
      const complianceRate = compliant / budgets.length
      s += (complianceRate * 25) - 12.5
      f.push({ name: 'Orçamentos ok', value: `${compliant}/${budgets.length}`, good: complianceRate >= 0.8 })
    }

    // Factor 3: Income exists
    if (balance.income > 0) {
      s += 5
      f.push({ name: 'Receita registrada', value: '✓', good: true })
    } else {
      s -= 5
      f.push({ name: 'Receita registrada', value: '✗', good: false })
    }

    // Factor 4: Goals progress
    if (goals.length > 0) {
      const progressing = goals.filter(g => (g.currentAmount || 0) > 0).length
      if (progressing > 0) { s += 5; f.push({ name: 'Metas ativas', value: `${progressing}`, good: true }) }
    }

    // Clamp 0-100
    s = Math.max(0, Math.min(100, Math.round(s)))

    let lbl = 'Crítico'
    let clr = '#FF6B6B'
    if (s >= 80) { lbl = 'Excelente'; clr = '#00D09C' }
    else if (s >= 60) { lbl = 'Bom'; clr = '#00B894' }
    else if (s >= 40) { lbl = 'Regular'; clr = '#FDCB6E' }
    else if (s >= 20) { lbl = 'Atenção'; clr = '#E17055' }

    return { score: s, label: lbl, color: clr, factors: f }
  }, [month, year, getBalance, budgets, getExpensesByCategory, goals])

  const circumference = 2 * Math.PI * 54
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="health-widget">
      <div className="health-ring-container">
        <svg className="health-ring" viewBox="0 0 120 120">
          <circle className="health-ring-bg" cx="60" cy="60" r="54" />
          <circle
            className="health-ring-fill"
            cx="60" cy="60" r="54"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: offset,
              stroke: color,
            }}
          />
        </svg>
        <div className="health-ring-center">
          <span className="health-score" style={{ color }}>{score}</span>
          <span className="health-label">{label}</span>
        </div>
      </div>
      <div className="health-factors">
        {factors.map((f, i) => (
          <div key={i} className="health-factor">
            <span className={`health-factor-dot ${f.good ? 'good' : 'bad'}`} />
            <span className="health-factor-name">{f.name}</span>
            <span className="health-factor-value">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
