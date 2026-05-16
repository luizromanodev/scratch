import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../../context/FinanceContext'
import { formatCurrency } from '../../utils/formatCurrency'
import { getCategoryById, CategoryIcon } from '../../utils/categories'
import { Zap, ChevronRight } from 'lucide-react'
import './QuickTransactions.css'

export default function QuickTransactions() {
  const navigate = useNavigate()
  const { transactions, categories, currency } = useFinance()

  // Find most frequent transactions (by description+category+type)
  const frequentTxs = useMemo(() => {
    if (transactions.length < 5) return []

    const map = {}
    transactions.forEach(tx => {
      const key = `${tx.description || ''}_${tx.category}_${tx.type}`
      if (!map[key]) {
        map[key] = { count: 0, tx, key }
      }
      map[key].count++
      // Keep the latest amount
      if (new Date(tx.date) > new Date(map[key].tx.date)) {
        map[key].tx = tx
      }
    })

    return Object.values(map)
      .filter(item => item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4)
  }, [transactions])

  if (frequentTxs.length === 0) return null

  const handleQuickAdd = (tx) => {
    const params = new URLSearchParams({
      type: tx.type,
      category: tx.category,
      amount: tx.amount.toString(),
      description: tx.description || '',
    })
    if (tx.accountId) params.set('account', tx.accountId)
    navigate(`/add?${params.toString()}`)
  }

  return (
    <section className="quick-tx-section animate-fade-in-up">
      <div className="quick-tx-header">
        <Zap size={16} className="quick-tx-icon" />
        <h2 className="section-title" style={{ margin: 0 }}>Atalhos</h2>
      </div>
      <div className="quick-tx-scroll">
        {frequentTxs.map(({ tx, count, key }) => {
          const cat = getCategoryById(categories, tx.category)
          return (
            <button key={key} className="quick-tx-chip" onClick={() => handleQuickAdd(tx)}>
              <div className="quick-tx-chip-icon" style={{ background: cat?.color + '18', color: cat?.color }}>
                <CategoryIcon iconName={cat?.icon} size={14} color={cat?.color} />
              </div>
              <div className="quick-tx-chip-info">
                <span className="quick-tx-chip-name">{tx.description || cat?.name}</span>
                <span className={`quick-tx-chip-amount ${tx.type}`}>
                  {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount, currency)}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
