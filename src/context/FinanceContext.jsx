import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { defaultCategories } from '../utils/categories'

const FinanceContext = createContext()

const STORAGE_KEY = 'finflow_data'

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) { console.error('Error loading data:', e) }
  return {
    transactions: [],
    categories: defaultCategories,
    banks: [],
    currency: 'BRL',
    budgets: [],
    goals: [],
    creditCards: [],
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) { console.error('Error saving data:', e) }
}

export function FinanceProvider({ children }) {
  const [data, setData] = useState(loadData)

  useEffect(() => { saveData(data) }, [data])

  // Transactions
  const addTransaction = useCallback((transaction) => {
    let newTxs = [];
    if (transaction.installments && parseInt(transaction.installments) > 1) {
      const installments = parseInt(transaction.installments);
      const baseAmount = transaction.amount / installments;
      for (let i = 0; i < installments; i++) {
        let d = new Date(transaction.date + 'T12:00:00'); // Use 12:00:00 to avoid timezone issues
        d.setMonth(d.getMonth() + i);
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const yStr = d.getFullYear();
        const dStr = String(d.getDate()).padStart(2, '0');
        
        newTxs.push({
          ...transaction,
          amount: baseAmount,
          description: `${transaction.description} (${i+1}/${installments})`,
          date: `${yStr}-${mStr}-${dStr}`,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          installmentIndex: i + 1,
          totalInstallments: installments,
          groupId: transaction.groupId || crypto.randomUUID()
        });
      }
    } else {
      newTxs.push({
        ...transaction,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
    }

    setData(prev => ({
      ...prev,
      transactions: [...newTxs, ...prev.transactions]
    }))
    return newTxs[0]
  }, [])

  const updateTransaction = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t)
    }))
  }, [])

  const deleteTransaction = useCallback((id) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id)
    }))
  }, [])

  // Categories
  const addCategory = useCallback((category) => {
    const newCat = { ...category, id: 'custom_' + crypto.randomUUID().slice(0, 8) }
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }))
    return newCat
  }, [])

  const deleteCategory = useCallback((id) => {
    if (!id.startsWith('custom_')) return // Can't delete default
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }))
  }, [])

  const updateCategory = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === id ? { ...c, ...updates } : c)
    }))
  }, [])

  // Currency
  const setCurrency = useCallback((currency) => {
    setData(prev => ({ ...prev, currency }))
  }, [])

  // Banks
  const connectBank = useCallback((bank) => {
    setData(prev => ({
      ...prev,
      banks: [...prev.banks.filter(b => b.id !== bank.id), { ...bank, status: 'connected', lastSync: new Date().toISOString() }]
    }))
  }, [])

  const disconnectBank = useCallback((bankId) => {
    setData(prev => ({
      ...prev,
      banks: prev.banks.filter(b => b.id !== bankId)
    }))
  }, [])

  // Budgets
  const addBudget = useCallback((budget) => {
    setData(prev => ({ ...prev, budgets: [...(prev.budgets || []), { ...budget, id: crypto.randomUUID() }] }))
  }, [])
  const updateBudget = useCallback((id, updates) => {
    setData(prev => ({ ...prev, budgets: (prev.budgets || []).map(b => b.id === id ? { ...b, ...updates } : b) }))
  }, [])
  const deleteBudget = useCallback((id) => {
    setData(prev => ({ ...prev, budgets: (prev.budgets || []).filter(b => b.id !== id) }))
  }, [])

  // Goals
  const addGoal = useCallback((goal) => {
    setData(prev => ({ ...prev, goals: [...(prev.goals || []), { ...goal, id: crypto.randomUUID(), currentAmount: goal.currentAmount || 0 }] }))
  }, [])
  const updateGoal = useCallback((id, updates) => {
    setData(prev => ({ ...prev, goals: (prev.goals || []).map(g => g.id === id ? { ...g, ...updates } : g) }))
  }, [])
  const deleteGoal = useCallback((id) => {
    setData(prev => ({ ...prev, goals: (prev.goals || []).filter(g => g.id !== id) }))
  }, [])

  // Credit Cards
  const addCreditCard = useCallback((card) => {
    setData(prev => ({ ...prev, creditCards: [...(prev.creditCards || []), { ...card, id: crypto.randomUUID() }] }))
  }, [])
  const updateCreditCard = useCallback((id, updates) => {
    setData(prev => ({ ...prev, creditCards: (prev.creditCards || []).map(c => c.id === id ? { ...c, ...updates } : c) }))
  }, [])
  const deleteCreditCard = useCallback((id) => {
    setData(prev => ({ ...prev, creditCards: (prev.creditCards || []).filter(c => c.id !== id) }))
  }, [])

  // ── Credit Card Invoice Calculation ──
  const getCardInvoice = useCallback((cardId, month, year) => {
    const now = new Date()
    const m = month !== undefined ? month : now.getMonth()
    const y = year !== undefined ? year : now.getFullYear()
    return data.transactions
      .filter(t => {
        if (t.type !== 'expense' || t.creditCardId !== cardId) return false
        const d = new Date(t.date + 'T00:00:00')
        return d.getMonth() === m && d.getFullYear() === y
      })
      .reduce((sum, t) => sum + t.amount, 0)
  }, [data.transactions])

  // Credit cards with live invoice data
  const creditCardsWithInvoice = useMemo(() => {
    const now = new Date()
    return (data.creditCards || []).map(card => ({
      ...card,
      currentInvoice: getCardInvoice(card.id, now.getMonth(), now.getFullYear()),
    }))
  }, [data.creditCards, getCardInvoice])

  // ── Recurring Transactions ──
  const processRecurring = useCallback(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const recurring = data.transactions.filter(t => t.isRecurring && !t._generatedFrom)
    let newTxs = []

    recurring.forEach(src => {
      const srcDate = new Date(src.date + 'T12:00:00')
      // Generate for each month from the source date until the current month
      let cursor = new Date(srcDate)
      cursor.setMonth(cursor.getMonth() + 1)

      while (cursor <= today) {
        const mStr = String(cursor.getMonth() + 1).padStart(2, '0')
        const yStr = cursor.getFullYear()
        const dStr = String(Math.min(cursor.getDate(), new Date(yStr, cursor.getMonth() + 1, 0).getDate())).padStart(2, '0')
        const dateKey = `${yStr}-${mStr}-${dStr}`

        // Check if this recurring entry already exists for this month
        const exists = data.transactions.some(t =>
          t._generatedFrom === src.id &&
          t.date.startsWith(`${yStr}-${mStr}`)
        )

        if (!exists) {
          newTxs.push({
            ...src,
            id: crypto.randomUUID(),
            date: dateKey,
            createdAt: new Date().toISOString(),
            _generatedFrom: src.id,
            isRecurring: false, // The generated copy is not itself recurring
          })
        }

        cursor.setMonth(cursor.getMonth() + 1)
      }
    })

    if (newTxs.length > 0) {
      setData(prev => ({
        ...prev,
        transactions: [...newTxs, ...prev.transactions]
      }))
    }
    return newTxs.length
  }, [data.transactions])

  // Process recurring on mount
  useEffect(() => {
    processRecurring()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Computed values
  const getBalance = useCallback((month, year) => {
    let txs = data.transactions
    if (month !== undefined && year !== undefined) {
      txs = txs.filter(t => {
        const d = new Date(t.date + 'T00:00:00')
        return d.getMonth() === month && d.getFullYear() === year
      })
    }
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expense, balance: income - expense, total: income + expense }
  }, [data.transactions])

  const getTransactionsByMonth = useCallback((month, year) => {
    return data.transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return d.getMonth() === month && d.getFullYear() === year
    }).sort((a, b) => b.date.localeCompare(a.date))
  }, [data.transactions])

  const getExpensesByCategory = useCallback((month, year) => {
    const txs = data.transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return t.type === 'expense' && d.getMonth() === month && d.getFullYear() === year
    })
    const grouped = {}
    txs.forEach(t => {
      if (!grouped[t.category]) grouped[t.category] = 0
      grouped[t.category] += t.amount
    })
    return Object.entries(grouped)
      .map(([catId, amount]) => {
        const cat = data.categories.find(c => c.id === catId) || { name: 'Outros', color: '#636E72' }
        return { categoryId: catId, name: cat.name, color: cat.color, amount }
      })
      .sort((a, b) => b.amount - a.amount)
  }, [data.transactions, data.categories])

  const clearAllData = useCallback(() => {
    setData({
      transactions: [],
      categories: defaultCategories,
      banks: [],
      currency: 'BRL',
      budgets: [],
      goals: [],
      creditCards: [],
    })
  }, [])

  const value = {
    transactions: data.transactions || [],
    categories: data.categories || defaultCategories,
    banks: data.banks || [],
    currency: data.currency || 'BRL',
    budgets: data.budgets || [],
    goals: data.goals || [],
    creditCards: creditCardsWithInvoice,
    addTransaction, updateTransaction, deleteTransaction,
    addCategory, deleteCategory, updateCategory,
    setCurrency,
    connectBank, disconnectBank,
    addBudget, updateBudget, deleteBudget,
    addGoal, updateGoal, deleteGoal,
    addCreditCard, updateCreditCard, deleteCreditCard,
    getBalance, getTransactionsByMonth, getExpensesByCategory,
    getCardInvoice, processRecurring,
    clearAllData,
  }

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) throw new Error('useFinance must be used within FinanceProvider')
  return context
}
