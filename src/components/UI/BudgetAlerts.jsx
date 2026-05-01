import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../../context/FinanceContext'
import { useToast } from './Toast'
import { formatCurrency } from '../../utils/formatCurrency'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import './BudgetAlerts.css'

export default function BudgetAlerts() {
  const { budgets, categories, currency, getExpensesByCategory } = useFinance()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const notifiedRef = useRef(false)

  const currentDate = new Date()
  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()

  const expensesByCategory = useMemo(
    () => getExpensesByCategory(month, year),
    [getExpensesByCategory, month, year]
  )

  const alerts = useMemo(() => {
    return budgets
      .map(budget => {
        const cat = categories.find(c => c.id === budget.categoryId)
        const expense = expensesByCategory.find(e => e.categoryId === budget.categoryId)
        const spent = expense ? expense.amount : 0
        const percentage = (spent / budget.limit) * 100
        const remaining = budget.limit - spent

        if (percentage >= 100) {
          return {
            type: 'exceeded',
            category: cat?.name || 'Desconhecida',
            color: cat?.color || '#888',
            spent,
            limit: budget.limit,
            percentage,
            over: spent - budget.limit,
          }
        } else if (percentage >= 80) {
          return {
            type: 'warning',
            category: cat?.name || 'Desconhecida',
            color: cat?.color || '#888',
            spent,
            limit: budget.limit,
            percentage,
            remaining,
          }
        }
        return null
      })
      .filter(Boolean)
      .sort((a, b) => b.percentage - a.percentage)
  }, [budgets, categories, expensesByCategory])

  // Show toast notifications once on mount
  useEffect(() => {
    if (notifiedRef.current || alerts.length === 0) return
    notifiedRef.current = true

    // Small delay so the page loads first
    const timer = setTimeout(() => {
      const exceeded = alerts.filter(a => a.type === 'exceeded')
      const warnings = alerts.filter(a => a.type === 'warning')

      if (exceeded.length > 0) {
        const names = exceeded.map(a => a.category).join(', ')
        addToast(
          `⚠️ Orçamento estourado: ${names}`,
          'error',
          5000
        )
      }
      if (warnings.length > 0) {
        const names = warnings.map(a => a.category).join(', ')
        addToast(
          `Atenção: ${names} acima de 80% do orçamento`,
          'warning',
          5000
        )
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [alerts, addToast])

  // Also try browser notifications (if permission granted)
  useEffect(() => {
    if (alerts.length === 0) return
    if (!('Notification' in window)) return

    // Request permission on first alert
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    if (Notification.permission === 'granted') {
      const notifiedKey = `finflow_budget_notified_${month}_${year}`
      if (localStorage.getItem(notifiedKey)) return
      localStorage.setItem(notifiedKey, 'true')

      const exceeded = alerts.filter(a => a.type === 'exceeded')
      if (exceeded.length > 0) {
        try {
          new Notification('FinFlow — Orçamento Estourado', {
            body: `${exceeded.map(a => a.category).join(', ')} ultrapassou o limite!`,
            icon: '/pwa-192x192.png',
            badge: '/pwa-64x64.png',
          })
        } catch { /* Notification API may not be available in some contexts */ }
      }
    }
  }, [alerts, month, year])

  if (alerts.length === 0) return null

  return (
    <div className="budget-alerts animate-fade-in-up">
      {alerts.map((alert, i) => (
        <button
          key={i}
          className={`budget-alert-item alert-${alert.type}`}
          onClick={() => navigate('/budgets')}
        >
          <div className="budget-alert-icon">
            {alert.type === 'exceeded' ? (
              <AlertTriangle size={16} />
            ) : (
              <TrendingUp size={16} />
            )}
          </div>
          <div className="budget-alert-info">
            <span className="budget-alert-category">{alert.category}</span>
            <span className="budget-alert-detail">
              {alert.type === 'exceeded'
                ? `Estourou ${formatCurrency(alert.over, currency)} acima do limite`
                : `${Math.round(alert.percentage)}% usado — faltam ${formatCurrency(alert.remaining, currency)}`
              }
            </span>
          </div>
          <div className="budget-alert-badge">
            {Math.round(alert.percentage)}%
          </div>
        </button>
      ))}
    </div>
  )
}
