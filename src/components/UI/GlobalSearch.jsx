import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../../context/FinanceContext'
import { formatCurrency } from '../../utils/formatCurrency'
import { getRelativeDate } from '../../utils/dateUtils'
import { getCategoryById, CategoryIcon } from '../../utils/categories'
import { Search, X, ArrowRight, Banknote, Target, CreditCard, Tags } from 'lucide-react'
import './GlobalSearch.css'

export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { transactions, categories, goals, creditCards, currency } = useFinance()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return null
    const q = query.toLowerCase()

    // Search transactions
    const txResults = transactions
      .filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (getCategoryById(categories, t.category)?.name || '').toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map(t => ({
        type: 'transaction',
        id: t.id,
        title: t.description || getCategoryById(categories, t.category)?.name,
        subtitle: getRelativeDate(t.date),
        extra: `${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, currency)}`,
        extraClass: t.type,
        icon: getCategoryById(categories, t.category),
        action: () => navigate(`/add?edit=${t.id}`),
      }))

    // Search categories
    const catResults = categories
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 4)
      .map(c => ({
        type: 'category',
        id: c.id,
        title: c.name,
        subtitle: c.type === 'income' ? 'Receita' : 'Despesa',
        icon: c,
        action: () => navigate('/categories'),
      }))

    // Search goals
    const goalResults = goals
      .filter(g => g.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map(g => ({
        type: 'goal',
        id: g.id,
        title: g.name,
        subtitle: `${formatCurrency(g.currentAmount || 0, currency)} de ${formatCurrency(g.targetAmount, currency)}`,
        color: g.color,
        action: () => navigate('/goals'),
      }))

    // Search cards
    const cardResults = creditCards
      .filter(c => c.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({
        type: 'card',
        id: c.id,
        title: c.name,
        subtitle: `Limite: ${formatCurrency(c.limit, currency)}`,
        color: c.color,
        action: () => navigate('/banks'),
      }))

    const all = [...txResults, ...catResults, ...goalResults, ...cardResults]
    return all.length > 0 ? all : []
  }, [query, transactions, categories, goals, creditCards, currency, navigate])

  // Group results by type
  const grouped = useMemo(() => {
    if (!results) return []
    const groups = {}
    results.forEach(r => {
      if (!groups[r.type]) groups[r.type] = []
      groups[r.type].push(r)
    })
    return Object.entries(groups)
  }, [results])

  if (!isOpen) return null

  const getResultIcon = (result) => {
    if (result.type === 'transaction' || result.type === 'category') {
      return (
        <div className="gs-result-icon" style={{ background: result.icon?.color + '18', color: result.icon?.color }}>
          <CategoryIcon iconName={result.icon?.icon} size={16} color={result.icon?.color} />
        </div>
      )
    }
    if (result.type === 'goal') {
      return (
        <div className="gs-result-icon" style={{ background: result.color + '18', color: result.color }}>
          <Target size={16} />
        </div>
      )
    }
    if (result.type === 'card') {
      return (
        <div className="gs-result-icon" style={{ background: result.color + '18', color: result.color }}>
          <CreditCard size={16} />
        </div>
      )
    }
    return null
  }

  const typeLabels = { transaction: 'Transações', category: 'Categorias', goal: 'Metas', card: 'Cartões' }

  return createPortal(
    <div className="gs-overlay" onClick={onClose}>
      <div className="gs-container animate-fade-in-down" onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <div className="gs-input-wrapper">
          <Search size={18} className="gs-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="gs-input"
            placeholder="Buscar transações, categorias, metas..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            id="global-search-input"
          />
          {query && (
            <button className="gs-clear" onClick={() => setQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="gs-results">
          {query.length >= 2 && results !== null && results.length === 0 && (
            <div className="gs-empty">
              <span className="gs-empty-emoji">🔍</span>
              <p>Nenhum resultado para "<strong>{query}</strong>"</p>
            </div>
          )}

          {grouped.map(([type, items]) => (
            <div key={type} className="gs-group">
              <h4 className="gs-group-title">{typeLabels[type]}</h4>
              {items.map(result => (
                <button
                  key={result.id}
                  className="gs-result-item"
                  onClick={() => { result.action(); onClose() }}
                >
                  {getResultIcon(result)}
                  <div className="gs-result-info">
                    <span className="gs-result-title">{result.title}</span>
                    <span className="gs-result-subtitle">{result.subtitle}</span>
                  </div>
                  {result.extra && (
                    <span className={`gs-result-extra ${result.extraClass || ''}`}>
                      {result.extra}
                    </span>
                  )}
                  <ArrowRight size={14} className="gs-result-arrow" />
                </button>
              ))}
            </div>
          ))}

          {!query && (
            <div className="gs-hints">
              <p className="gs-hint-title">Dicas de busca</p>
              <div className="gs-hint-chips">
                <button className="gs-hint-chip" onClick={() => setQuery('Alimentação')}>Alimentação</button>
                <button className="gs-hint-chip" onClick={() => setQuery('Salário')}>Salário</button>
                <button className="gs-hint-chip" onClick={() => setQuery('Nubank')}>Nubank</button>
                <button className="gs-hint-chip" onClick={() => setQuery('Viagem')}>Viagem</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
