import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { formatCurrency } from '../utils/formatCurrency'
import { groupByDate } from '../utils/dateUtils'
import { getCategoryById, CategoryIcon } from '../utils/categories'
import { parseImportFile } from '../utils/importUtils'
import { Search, SlidersHorizontal, Trash2, X, FileUp, Pencil, ChevronDown } from 'lucide-react'
import { useRef } from 'react'
import SwipeableRow from '../components/UI/SwipeableRow'
import './TransactionsPage.css'

export default function TransactionsPage() {
  const { transactions, categories, currency, creditCards, deleteTransaction, addTransaction } = useFinance()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // all, income, expense
  const [showFilters, setShowFilters] = useState(false)
  
  // Advanced filters
  const [filterPeriod, setFilterPeriod] = useState('all') // all, week, month, custom
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterCard, setFilterCard] = useState('all')
  const [filterMinValue, setFilterMinValue] = useState('')
  const [filterMaxValue, setFilterMaxValue] = useState('')
  const [sortBy, setSortBy] = useState('date') // date, value_asc, value_desc
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')

  const hasActiveFilters = filterType !== 'all' || filterPeriod !== 'all' || filterCategory !== 'all' || 
    filterCard !== 'all' || filterMinValue || filterMaxValue || sortBy !== 'date'

  const clearFilters = () => {
    setFilterType('all')
    setFilterPeriod('all')
    setFilterCategory('all')
    setFilterCard('all')
    setFilterMinValue('')
    setFilterMaxValue('')
    setSortBy('date')
    setCustomDateFrom('')
    setCustomDateTo('')
  }

  const filtered = useMemo(() => {
    let txs = [...transactions]
    
    // Type filter
    if (filterType !== 'all') txs = txs.filter(t => t.type === filterType)
    
    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      txs = txs.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (getCategoryById(categories, t.category)?.name || '').toLowerCase().includes(q)
      )
    }

    // Period filter
    if (filterPeriod !== 'all') {
      const today = new Date()
      if (filterPeriod === 'week') {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekStr = weekAgo.toISOString().split('T')[0]
        txs = txs.filter(t => t.date >= weekStr)
      } else if (filterPeriod === 'month') {
        const mStr = String(today.getMonth() + 1).padStart(2, '0')
        const prefix = `${today.getFullYear()}-${mStr}`
        txs = txs.filter(t => t.date.startsWith(prefix))
      } else if (filterPeriod === 'custom') {
        if (customDateFrom) txs = txs.filter(t => t.date >= customDateFrom)
        if (customDateTo) txs = txs.filter(t => t.date <= customDateTo)
      }
    }

    // Category filter
    if (filterCategory !== 'all') {
      txs = txs.filter(t => t.category === filterCategory)
    }

    // Card filter
    if (filterCard !== 'all') {
      txs = txs.filter(t => t.creditCardId === filterCard)
    }

    // Value range
    const minV = parseFloat(filterMinValue)
    const maxV = parseFloat(filterMaxValue)
    if (!isNaN(minV)) txs = txs.filter(t => t.amount >= minV)
    if (!isNaN(maxV)) txs = txs.filter(t => t.amount <= maxV)

    // Sort
    if (sortBy === 'value_desc') {
      txs.sort((a, b) => b.amount - a.amount)
    } else if (sortBy === 'value_asc') {
      txs.sort((a, b) => a.amount - b.amount)
    } else {
      txs.sort((a, b) => b.date.localeCompare(a.date))
    }

    return txs
  }, [transactions, filterType, search, categories, filterPeriod, filterCategory, filterCard, filterMinValue, filterMaxValue, sortBy, customDateFrom, customDateTo])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const handleDelete = (id) => {
    deleteTransaction(id)
    addToast('Transação removida', 'info')
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      addToast('Lendo arquivo...', 'info')
      const importedTxs = await parseImportFile(file)
      
      if (importedTxs.length === 0) {
        addToast('Nenhuma transação encontrada no arquivo', 'warning')
        return
      }

      importedTxs.forEach(tx => addTransaction(tx))
      addToast(`${importedTxs.length} transações importadas com sucesso!`, 'success')
      
    } catch (err) {
      addToast(err.message || 'Erro ao importar arquivo', 'error')
    } finally {
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Unique categories from current transactions
  const usedCategories = useMemo(() => {
    const ids = [...new Set(transactions.map(t => t.category))]
    return ids.map(id => getCategoryById(categories, id)).filter(Boolean)
  }, [transactions, categories])

  return (
    <div className="page container">
      <header className="txp-header">
        <h1 className="txp-title">Transações</h1>
        <div className="txp-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="txp-filter-btn" onClick={() => fileInputRef.current?.click()} aria-label="Importar">
            <FileUp size={20} />
          </button>
          <button 
            className={`txp-filter-btn ${hasActiveFilters ? 'active' : ''}`} 
            onClick={() => setShowFilters(!showFilters)} 
            aria-label="Filtros"
          >
            <SlidersHorizontal size={20} />
            {hasActiveFilters && <span className="txp-filter-badge" />}
          </button>
        </div>
      </header>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImport} 
        accept=".csv,.ofx" 
        style={{ display: 'none' }} 
      />

      {/* Search */}
      <div className="txp-search">
        <Search size={18} className="txp-search-icon" />
        <input
          type="text"
          placeholder="Buscar transações..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="txp-search-input"
          id="search-transactions"
        />
        {search && (
          <button className="txp-search-clear" onClick={() => setSearch('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Basic Type Filters - always visible */}
      <div className="txp-filters">
        {['all', 'income', 'expense'].map(f => (
          <button
            key={f}
            className={`txp-filter-chip ${filterType === f ? 'active' : ''}`}
            onClick={() => setFilterType(f)}
          >
            {f === 'all' ? 'Todas' : f === 'income' ? 'Receitas' : 'Despesas'}
          </button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="txp-advanced-filters animate-fade-in-up">
          {/* Period */}
          <div className="txp-adv-group">
            <label className="txp-adv-label">Período</label>
            <div className="txp-adv-chips">
              {[
                ['all', 'Tudo'],
                ['week', 'Esta semana'],
                ['month', 'Este mês'],
                ['custom', 'Personalizado'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`txp-adv-chip ${filterPeriod === value ? 'active' : ''}`}
                  onClick={() => setFilterPeriod(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {filterPeriod === 'custom' && (
              <div className="txp-adv-date-range">
                <input type="date" value={customDateFrom} onChange={e => setCustomDateFrom(e.target.value)} className="txp-adv-date" />
                <span className="txp-adv-date-sep">até</span>
                <input type="date" value={customDateTo} onChange={e => setCustomDateTo(e.target.value)} className="txp-adv-date" />
              </div>
            )}
          </div>

          {/* Category */}
          <div className="txp-adv-group">
            <label className="txp-adv-label">Categoria</label>
            <div className="txp-adv-select-wrapper">
              <select 
                className="txp-adv-select" 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">Todas as categorias</option>
                {usedCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="txp-adv-select-icon" />
            </div>
          </div>

          {/* Credit Card */}
          {creditCards.length > 0 && (
            <div className="txp-adv-group">
              <label className="txp-adv-label">Cartão de crédito</label>
              <div className="txp-adv-select-wrapper">
                <select 
                  className="txp-adv-select" 
                  value={filterCard} 
                  onChange={e => setFilterCard(e.target.value)}
                >
                  <option value="all">Todos os cartões</option>
                  {creditCards.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="txp-adv-select-icon" />
              </div>
            </div>
          )}

          {/* Value range */}
          <div className="txp-adv-group">
            <label className="txp-adv-label">Faixa de valor</label>
            <div className="txp-adv-value-range">
              <input 
                type="number" 
                className="txp-adv-value-input" 
                placeholder="Min" 
                value={filterMinValue} 
                onChange={e => setFilterMinValue(e.target.value)} 
              />
              <span className="txp-adv-date-sep">até</span>
              <input 
                type="number" 
                className="txp-adv-value-input" 
                placeholder="Max" 
                value={filterMaxValue} 
                onChange={e => setFilterMaxValue(e.target.value)} 
              />
            </div>
          </div>

          {/* Sort */}
          <div className="txp-adv-group">
            <label className="txp-adv-label">Ordenar por</label>
            <div className="txp-adv-chips">
              {[
                ['date', 'Data (recente)'],
                ['value_desc', 'Maior valor'],
                ['value_asc', 'Menor valor'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`txp-adv-chip ${sortBy === value ? 'active' : ''}`}
                  onClick={() => setSortBy(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear button */}
          {hasActiveFilters && (
            <button className="txp-adv-clear" onClick={clearFilters}>
              <X size={14} /> Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="txp-count">{filtered.length} transação(ões)</p>

      {/* Transaction Groups */}
      {grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-emoji">🔍</div>
          <p>Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="txp-groups stagger">
          {grouped.map(group => (
            <div key={group.date} className="txp-group">
              <h3 className="txp-group-date">{group.label}</h3>
              <div className="transaction-list">
                {group.items.map(tx => {
                  const cat = getCategoryById(categories, tx.category)
                  return (
                    <SwipeableRow
                      key={tx.id}
                      onSwipeRight={() => navigate(`/add?edit=${tx.id}`)}
                      onSwipeLeft={() => handleDelete(tx.id)}
                      leftLabel="Editar"
                      rightLabel="Excluir"
                    >
                      <div className="transaction-item txp-item">
                        <div className="tx-icon" style={{ background: cat?.color + '18', color: cat?.color }}>
                          <CategoryIcon iconName={cat?.icon} size={18} color={cat?.color} />
                        </div>
                        <div className="tx-info">
                          <span className="tx-desc">{tx.description || cat?.name}</span>
                          <span className="tx-date">{cat?.name}</span>
                        </div>
                        <div className="txp-actions">
                          <span className={`tx-amount ${tx.type}`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                          </span>
                          <button className="txp-edit" onClick={() => navigate(`/add?edit=${tx.id}`)} aria-label="Editar">
                            <Pencil size={14} />
                          </button>
                          <button className="txp-delete" onClick={() => handleDelete(tx.id)} aria-label="Deletar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </SwipeableRow>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
