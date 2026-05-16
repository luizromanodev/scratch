import { useMemo } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { formatCurrency } from '../../utils/formatCurrency'
import { TrendingUp, TrendingDown, Zap, Flame, PiggyBank, AlertTriangle, Sparkles } from 'lucide-react'
import './SpendingInsights.css'

export default function SpendingInsights({ month, year }) {
  const { getBalance, getExpensesByCategory, transactions, budgets, currency } = useFinance()

  const insights = useMemo(() => {
    const tips = []
    const balance = getBalance(month, year)
    const expenses = getExpensesByCategory(month, year)

    // Compare with previous month
    let prevM = month - 1, prevY = year
    if (prevM < 0) { prevM = 11; prevY-- }
    const prevBalance = getBalance(prevM, prevY)

    // 1. Saving rate
    if (balance.income > 0) {
      const savingRate = ((balance.income - balance.expense) / balance.income * 100)
      if (savingRate >= 20) {
        tips.push({ icon: '🏆', color: '#00D09C', title: 'Ótima taxa de economia!', desc: `Você está poupando ${Math.round(savingRate)}% da sua renda. Continue assim!`, type: 'success' })
      } else if (savingRate >= 0) {
        tips.push({ icon: '💡', color: '#FDCB6E', title: 'Tente poupar mais', desc: `Sua taxa de economia é ${Math.round(savingRate)}%. O ideal é acima de 20%.`, type: 'warning' })
      } else {
        tips.push({ icon: '🚨', color: '#FF6B6B', title: 'Gastando mais do que ganha', desc: `Você está ${Math.round(Math.abs(savingRate))}% acima da sua renda.`, type: 'danger' })
      }
    }

    // 2. Spending trend
    if (prevBalance.expense > 0) {
      const changePercent = ((balance.expense - prevBalance.expense) / prevBalance.expense * 100)
      if (changePercent > 15) {
        tips.push({ icon: '📈', color: '#FF6B6B', title: 'Gastos em alta', desc: `Aumento de ${Math.round(changePercent)}% em relação ao mês anterior.`, type: 'danger' })
      } else if (changePercent < -10) {
        tips.push({ icon: '📉', color: '#00D09C', title: 'Gastos em queda!', desc: `Reduziu ${Math.round(Math.abs(changePercent))}% vs mês anterior. Parabéns!`, type: 'success' })
      }
    }

    // 3. Top category insight
    if (expenses.length > 0) {
      const top = expenses[0]
      const topPct = balance.expense > 0 ? (top.amount / balance.expense * 100) : 0
      if (topPct > 50) {
        tips.push({ icon: '🎯', color: '#74B9FF', title: `${top.name} domina`, desc: `${Math.round(topPct)}% dos gastos estão em "${top.name}". Considere diversificar.`, type: 'info' })
      }
    }

    // 4. Daily spending projection
    const today = new Date()
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year
    if (isCurrentMonth && balance.expense > 0) {
      const daysPassed = today.getDate()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const projected = (balance.expense / daysPassed) * daysInMonth
      if (projected > balance.income && balance.income > 0) {
        tips.push({ icon: '⚡', color: '#E17055', title: 'Projeção de gasto alto', desc: `No ritmo atual, você gastará ${formatCurrency(projected, currency)} até o fim do mês.`, type: 'warning' })
      }
    }

    // 5. No income warning
    if (balance.income === 0 && balance.expense > 0) {
      tips.push({ icon: '💰', color: '#FDCB6E', title: 'Receita não registrada', desc: 'Registre suas receitas para ter uma visão completa das suas finanças.', type: 'info' })
    }

    return tips.slice(0, 3)
  }, [month, year, getBalance, getExpensesByCategory, transactions, budgets, currency])

  if (insights.length === 0) return null

  return (
    <section className="insights-section animate-fade-in-up">
      <div className="insights-header">
        <Sparkles size={16} className="insights-header-icon" />
        <h2 className="section-title" style={{ margin: 0 }}>Insights</h2>
      </div>
      <div className="insights-cards">
        {insights.map((tip, i) => (
          <div key={i} className={`insight-card insight-${tip.type}`}>
            <span className="insight-emoji">{tip.icon}</span>
            <div className="insight-content">
              <span className="insight-title">{tip.title}</span>
              <span className="insight-desc">{tip.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
