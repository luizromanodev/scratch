import { useState, useMemo } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { formatCurrency } from '../utils/formatCurrency'
import { groupByDate } from '../utils/dateUtils'
import { getCategoryById, CategoryIcon } from '../utils/categories'
import { parseImportFile } from '../utils/importUtils'
import { Search, SlidersHorizontal, Trash2, X, FileUp } from 'lucide-react'
import { useRef } from 'react'
import './TransactionsPage.css'

export default function TransactionsPage() {
  const { transactions, categories, currency, deleteTransaction, addTransaction } = useFinance()
  const { addToast } = useToast()
  const fileInputRef = useRef(null)

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all') // all, income, expense
  const [showFilters, setShowFilters] = useState(false)

  const filtered = useMemo(() => {
    let txs = [...transactions]
    if (filterType !== 'all') txs = txs.filter(t => t.type === filterType)
    if (search.trim()) {
      const q = search.toLowerCase()
      txs = txs.filter(t =>
        (t.description || '').toLowerCase().includes(q) ||
        (getCategoryById(categories, t.category)?.name || '').toLowerCase().includes(q)
      )
    }
    return txs.sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions, filterType, search, categories])

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

  return (
    <div className="page container">
      <header className="txp-header">
        <h1 className="txp-title">Transações</h1>
        <div className="txp-header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="txp-filter-btn" onClick={() => fileInputRef.current?.click()} aria-label="Importar">
            <FileUp size={20} />
          </button>
          <button className="txp-filter-btn" onClick={() => setShowFilters(!showFilters)} aria-label="Filtros">
            <SlidersHorizontal size={20} />
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

      {/* Filters */}
      {showFilters && (
        <div className="txp-filters animate-fade-in-up">
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
                    <div key={tx.id} className="transaction-item txp-item">
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
                        <button className="txp-delete" onClick={() => handleDelete(tx.id)} aria-label="Deletar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
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
