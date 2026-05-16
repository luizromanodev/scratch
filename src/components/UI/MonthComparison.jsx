import { useMemo } from 'react'
import { useFinance } from '../../context/FinanceContext'
import { formatCurrency } from '../../utils/formatCurrency'
import { getShortMonthName } from '../../utils/dateUtils'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import './MonthComparison.css'

export default function MonthComparison({ month, year }) {
  const { getBalance, currency } = useFinance()

  const comparison = useMemo(() => {
    const current = getBalance(month, year)
    let prevM = month - 1, prevY = year
    if (prevM < 0) { prevM = 11; prevY-- }
    const prev = getBalance(prevM, prevY)

    const calcChange = (curr, prv) => {
      if (prv === 0) return curr > 0 ? 100 : 0
      return ((curr - prv) / prv) * 100
    }

    return {
      currentMonth: getShortMonthName(month),
      prevMonth: getShortMonthName(prevM),
      income: { current: current.income, prev: prev.income, change: calcChange(current.income, prev.income) },
      expense: { current: current.expense, prev: prev.expense, change: calcChange(current.expense, prev.expense) },
      balance: { current: current.balance, prev: prev.balance, change: calcChange(current.balance, prev.balance) },
      hasPrevData: prev.income > 0 || prev.expense > 0,
    }
  }, [month, year, getBalance])

  if (!comparison.hasPrevData) return null

  const ChangeIndicator = ({ change, invert = false }) => {
    const isPositive = invert ? change < 0 : change > 0
    const isNeutral = Math.abs(change) < 1

    if (isNeutral) return <span className="mc-change neutral"><Minus size={12} /> 0%</span>
    if (isPositive) return <span className="mc-change positive"><ArrowUpRight size={12} /> {Math.abs(Math.round(change))}%</span>
    return <span className="mc-change negative"><ArrowDownRight size={12} /> {Math.abs(Math.round(change))}%</span>
  }

  return (
    <section className="mc-section animate-fade-in-up">
      <h2 className="section-title">Comparativo</h2>
      <div className="mc-card">
        <div className="mc-header">
          <span className="mc-prev">{comparison.prevMonth}</span>
          <span className="mc-arrow">→</span>
          <span className="mc-curr">{comparison.currentMonth}</span>
        </div>

        <div className="mc-rows">
          <div className="mc-row">
            <span className="mc-label">Receitas</span>
            <div className="mc-values">
              <span className="mc-prev-val">{formatCurrency(comparison.income.prev, currency)}</span>
              <span className="mc-curr-val">{formatCurrency(comparison.income.current, currency)}</span>
            </div>
            <ChangeIndicator change={comparison.income.change} />
          </div>

          <div className="mc-row">
            <span className="mc-label">Despesas</span>
            <div className="mc-values">
              <span className="mc-prev-val">{formatCurrency(comparison.expense.prev, currency)}</span>
              <span className="mc-curr-val">{formatCurrency(comparison.expense.current, currency)}</span>
            </div>
            <ChangeIndicator change={comparison.expense.change} invert />
          </div>

          <div className="mc-row mc-row-total">
            <span className="mc-label">Saldo</span>
            <div className="mc-values">
              <span className="mc-prev-val">{formatCurrency(comparison.balance.prev, currency)}</span>
              <span className={`mc-curr-val ${comparison.balance.current >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(comparison.balance.current, currency)}
              </span>
            </div>
            <ChangeIndicator change={comparison.balance.change} />
          </div>
        </div>
      </div>
    </section>
  )
}
