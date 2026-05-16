import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { formatCurrency } from '../utils/formatCurrency'
import { getCategoryById, CategoryIcon } from '../utils/categories'
import { ArrowLeft, Repeat, Pause, Play, CalendarDays, TrendingDown } from 'lucide-react'
import './RecurringPage.css'

export default function RecurringPage() {
  const navigate = useNavigate()
  const { getRecurringTransactions, toggleRecurring, categories, currency } = useFinance()
  const recurring = useMemo(() => getRecurringTransactions(), [getRecurringTransactions])

  const totalExpense = useMemo(() => recurring.filter(t => t.type === 'expense' && !t.isRecurringPaused).reduce((s, t) => s + t.amount, 0), [recurring])
  const totalIncome = useMemo(() => recurring.filter(t => t.type === 'income' && !t.isRecurringPaused).reduce((s, t) => s + t.amount, 0), [recurring])

  const getNextDate = (tx) => {
    const d = new Date(tx.date + 'T00:00:00')
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth(), d.getDate())
    if (next < now) next.setMonth(next.getMonth() + 1)
    return next
  }

  return (
    <div className="page container">
      <header className="rec-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Voltar"><ArrowLeft size={24} /></button>
        <div>
          <h1 className="rec-title">Recorrentes</h1>
          <p className="rec-subtitle">Assinaturas e contas fixas</p>
        </div>
      </header>
      <div className="rec-summary">
        <div className="rec-summary-card"><TrendingDown size={18} className="rec-icon-expense" /><div><span className="rec-sum-label">Despesas fixas</span><span className="rec-sum-value expense">{formatCurrency(totalExpense, currency)}</span></div></div>
        <div className="rec-summary-card"><Repeat size={18} className="rec-icon-income" /><div><span className="rec-sum-label">Receitas fixas</span><span className="rec-sum-value income">{formatCurrency(totalIncome, currency)}</span></div></div>
      </div>
      <div className="rec-total-bar glass"><span>Total mensal comprometido</span><span className="rec-total-value">{formatCurrency(totalExpense, currency)}/mês</span></div>
      {recurring.length === 0 ? (
        <div className="empty-state"><div className="empty-emoji">🔄</div><p>Nenhuma transação recorrente</p><span>Marque transações como "recorrente" para vê-las aqui.</span></div>
      ) : (
        <div className="rec-list stagger">
          {recurring.map(tx => {
            const cat = getCategoryById(categories, tx.category)
            const nextDate = getNextDate(tx)
            const daysUntil = Math.ceil((nextDate - new Date()) / (1000 * 60 * 60 * 24))
            const isPaused = tx.isRecurringPaused
            return (
              <div key={tx.id} className={`rec-card ${isPaused ? 'paused' : ''}`}>
                <div className="rec-card-left">
                  <div className="rec-card-icon" style={{ background: cat?.color + '18', color: cat?.color }}><CategoryIcon iconName={cat?.icon} size={18} color={cat?.color} /></div>
                  <div className="rec-card-info">
                    <span className="rec-card-name">{tx.description || cat?.name}</span>
                    <span className="rec-card-cat">{cat?.name}</span>
                    <div className="rec-card-next"><CalendarDays size={12} />{isPaused ? <span>Pausado</span> : <span>{daysUntil === 0 ? 'Hoje' : daysUntil === 1 ? 'Amanhã' : `Em ${daysUntil} dias`}</span>}</div>
                  </div>
                </div>
                <div className="rec-card-right">
                  <span className={`rec-card-amount ${tx.type}`}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}</span>
                  <button className={`rec-toggle-btn ${isPaused ? 'paused' : 'active'}`} onClick={() => toggleRecurring(tx.id)}>{isPaused ? <Play size={14} /> : <Pause size={14} />}</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
