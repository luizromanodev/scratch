import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from './AuthContext'
import { defaultCategories } from '../utils/categories'
import { notifyTransaction, runNotificationChecks } from '../utils/notificationManager'
import { isSupabaseEnabled } from '../lib/supabase'
import { loadUserData, saveUserData } from '../lib/dataService'

const FinanceContext = createContext()

const STORAGE_KEY_PREFIX = 'finflow_data_'
const LEGACY_STORAGE_KEY = 'finflow_data'

const DEFAULT_ACCOUNT = {
  id: 'main',
  name: 'Carteira Principal',
  type: 'checking', // checking, savings, cash, investment
  icon: 'Wallet',
  color: '#6C5CE7',
  initialBalance: 0,
}

function getDefaultData() {
  return {
    transactions: [],
    categories: defaultCategories,
    banks: [],
    currency: 'BRL',
    budgets: [],
    goals: [],
    creditCards: [],
    accounts: [DEFAULT_ACCOUNT],
    tags: [],
  }
}

function normalizeData(parsed) {
  if (!parsed) return null
  if (!parsed.accounts) parsed.accounts = [DEFAULT_ACCOUNT]
  if (!parsed.tags) parsed.tags = []
  if (!parsed.transactions) parsed.transactions = []
  if (!parsed.categories) parsed.categories = defaultCategories
  if (!parsed.budgets) parsed.budgets = []
  if (!parsed.goals) parsed.goals = []
  if (!parsed.creditCards) parsed.creditCards = []
  if (!parsed.banks) parsed.banks = []
  if (!parsed.currency) parsed.currency = 'BRL'
  return parsed
}

function loadDataLocal(userId) {
  try {
    // Try user-scoped data first
    const userKey = STORAGE_KEY_PREFIX + userId
    const saved = localStorage.getItem(userKey)
    if (saved) {
      return normalizeData(JSON.parse(saved))
    }

    // Migration: if legacy shared data exists and no user-scoped data yet, migrate it
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy) {
      const parsed = normalizeData(JSON.parse(legacy))
      // Save to user-scoped key
      localStorage.setItem(userKey, JSON.stringify(parsed))
      // Remove legacy key so it doesn't get re-migrated for another user
      localStorage.removeItem(LEGACY_STORAGE_KEY)
      return parsed
    }
  } catch (e) { console.error('Error loading data:', e) }
  return getDefaultData()
}

function saveDataLocal(userId, data) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(data))
  } catch (e) { console.error('Error saving data:', e) }
}

export function FinanceProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const [data, setData] = useState(() => loadDataLocal(userId))
  const [cloudSynced, setCloudSynced] = useState(false)
  const saveTimerRef = useRef(null)

  // Load data on userId change (local first, then cloud)
  useEffect(() => {
    if (!userId) return

    // Always load local data first (instant)
    setData(loadDataLocal(userId))

    // Then try to load from cloud (async)
    if (isSupabaseEnabled()) {
      loadUserData(userId).then(cloudData => {
        if (cloudData) {
          const normalized = normalizeData(cloudData)
          setData(normalized)
          // Also update local cache
          saveDataLocal(userId, normalized)
          setCloudSynced(true)
        }
      }).catch(() => {
        // Cloud load failed — local data is fine
      })
    }
  }, [userId])

  // Save data on changes — local immediately, cloud debounced
  useEffect(() => {
    if (!userId) return
    
    // Always save locally (instant)
    saveDataLocal(userId, data)
    
    // Debounce cloud save (2s)
    if (isSupabaseEnabled()) {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        saveUserData(userId, data).then(ok => {
          if (ok) setCloudSynced(true)
        })
      }, 2000)
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [data, userId])

  // ── Transactions ──
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

    // Fire push notification for the transaction
    try {
      notifyTransaction(newTxs[0])
    } catch { /* silent */ }

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

  // ── Categories ──
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

  // ── Currency ──
  const setCurrency = useCallback((currency) => {
    setData(prev => ({ ...prev, currency }))
  }, [])

  // ── Banks ──
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

  // ── Budgets ──
  const addBudget = useCallback((budget) => {
    setData(prev => ({ ...prev, budgets: [...(prev.budgets || []), { ...budget, id: crypto.randomUUID() }] }))
  }, [])
  const updateBudget = useCallback((id, updates) => {
    setData(prev => ({ ...prev, budgets: (prev.budgets || []).map(b => b.id === id ? { ...b, ...updates } : b) }))
  }, [])
  const deleteBudget = useCallback((id) => {
    setData(prev => ({ ...prev, budgets: (prev.budgets || []).filter(b => b.id !== id) }))
  }, [])

  // ── Goals ──
  const addGoal = useCallback((goal) => {
    setData(prev => ({ ...prev, goals: [...(prev.goals || []), { ...goal, id: crypto.randomUUID(), currentAmount: goal.currentAmount || 0 }] }))
  }, [])
  const updateGoal = useCallback((id, updates) => {
    setData(prev => ({ ...prev, goals: (prev.goals || []).map(g => g.id === id ? { ...g, ...updates } : g) }))
  }, [])
  const deleteGoal = useCallback((id) => {
    setData(prev => ({ ...prev, goals: (prev.goals || []).filter(g => g.id !== id) }))
  }, [])

  // ── Credit Cards ──
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

  // ── Accounts / Wallets ──
  const addAccount = useCallback((account) => {
    setData(prev => ({
      ...prev,
      accounts: [...(prev.accounts || []), { ...account, id: crypto.randomUUID() }]
    }))
  }, [])

  const updateAccount = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      accounts: (prev.accounts || []).map(a => a.id === id ? { ...a, ...updates } : a)
    }))
  }, [])

  const deleteAccount = useCallback((id) => {
    if (id === 'main') return // Can't delete default account
    setData(prev => ({
      ...prev,
      accounts: (prev.accounts || []).filter(a => a.id !== id)
    }))
  }, [])

  // Transfer between accounts (creates two linked transactions)
  const transferBetweenAccounts = useCallback((fromAccountId, toAccountId, amount, description, date) => {
    const transferId = crypto.randomUUID()
    const newTxs = [
      {
        id: crypto.randomUUID(),
        type: 'expense',
        amount,
        category: 'transfer',
        description: description || 'Transferência entre contas',
        date: date || new Date().toISOString().split('T')[0],
        accountId: fromAccountId,
        transferId,
        isTransfer: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        type: 'income',
        amount,
        category: 'transfer',
        description: description || 'Transferência entre contas',
        date: date || new Date().toISOString().split('T')[0],
        accountId: toAccountId,
        transferId,
        isTransfer: true,
        createdAt: new Date().toISOString(),
      },
    ]
    setData(prev => ({
      ...prev,
      transactions: [...newTxs, ...prev.transactions]
    }))
    return transferId
  }, [])

  // Get account balance
  const getAccountBalance = useCallback((accountId) => {
    const account = (data.accounts || []).find(a => a.id === accountId)
    const initial = account?.initialBalance || 0
    const txs = data.transactions.filter(t => t.accountId === accountId)
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return initial + income - expense
  }, [data.transactions, data.accounts])

  // ── Tags ──
  const addTag = useCallback((tag) => {
    const newTag = { ...tag, id: 'tag_' + crypto.randomUUID().slice(0, 8) }
    setData(prev => ({
      ...prev,
      tags: [...(prev.tags || []), newTag]
    }))
    return newTag
  }, [])

  const deleteTag = useCallback((id) => {
    setData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t.id !== id),
      // Also remove tag from all transactions
      transactions: prev.transactions.map(t => ({
        ...t,
        tags: (t.tags || []).filter(tid => tid !== id)
      }))
    }))
  }, [])

  const updateTag = useCallback((id, updates) => {
    setData(prev => ({
      ...prev,
      tags: (prev.tags || []).map(t => t.id === id ? { ...t, ...updates } : t)
    }))
  }, [])

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

  // Run periodic notification checks
  useEffect(() => {
    try {
      runNotificationChecks(data)
    } catch { /* silent */ }

    // Also listen for SW messages requesting checks
    const handleSWMessage = (event) => {
      if (event.data?.type === 'CHECK_NOTIFICATIONS') {
        try { runNotificationChecks(data) } catch { /* silent */ }
      }
    }
    navigator.serviceWorker?.addEventListener('message', handleSWMessage)
    return () => navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
  }, [data.transactions.length, data.budgets, data.creditCards, data.goals]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computed values ──
  const getBalance = useCallback((month, year, accountId) => {
    let txs = data.transactions
    if (month !== undefined && year !== undefined) {
      txs = txs.filter(t => {
        const d = new Date(t.date + 'T00:00:00')
        return d.getMonth() === month && d.getFullYear() === year
      })
    }
    if (accountId) {
      txs = txs.filter(t => t.accountId === accountId)
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

  // ── Backup & Restore ──
  const exportData = useCallback(() => {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        transactions: data.transactions,
        categories: data.categories,
        banks: data.banks,
        currency: data.currency,
        budgets: data.budgets,
        goals: data.goals,
        creditCards: data.creditCards,
        accounts: data.accounts,
        tags: data.tags,
      }
    }
  }, [data])

  const importData = useCallback((jsonData) => {
    // Validate structure
    if (!jsonData || !jsonData.data) {
      throw new Error('Formato de backup inválido')
    }
    const d = jsonData.data
    if (!Array.isArray(d.transactions)) {
      throw new Error('Backup não contém transações válidas')
    }
    setData({
      transactions: d.transactions || [],
      categories: d.categories || defaultCategories,
      banks: d.banks || [],
      currency: d.currency || 'BRL',
      budgets: d.budgets || [],
      goals: d.goals || [],
      creditCards: d.creditCards || [],
      accounts: d.accounts || [DEFAULT_ACCOUNT],
      tags: d.tags || [],
    })
  }, [])

  // ── Achievements / Gamification ──
  const achievements = useMemo(() => {
    const list = []
    const txCount = data.transactions.length
    const goalsDone = (data.goals || []).filter(g => (g.currentAmount || 0) >= g.targetAmount).length
    const budgetCount = (data.budgets || []).length
    const catCount = (data.categories || []).filter(c => c.id.startsWith('custom_')).length
    const accountCount = (data.accounts || []).length
    const tagCount = (data.tags || []).length
    const cardCount = (data.creditCards || []).length

    // Transaction milestones
    if (txCount >= 1) list.push({ id: 'first_tx', icon: '🎯', name: 'Primeira Transação', desc: 'Registrou sua primeira transação', unlocked: true })
    else list.push({ id: 'first_tx', icon: '🎯', name: 'Primeira Transação', desc: 'Registre sua primeira transação', unlocked: false })

    if (txCount >= 10) list.push({ id: 'tx_10', icon: '📝', name: 'Organizando as Finanças', desc: 'Registrou 10 transações', unlocked: true })
    else list.push({ id: 'tx_10', icon: '📝', name: 'Organizando as Finanças', desc: `${txCount}/10 transações`, unlocked: false, progress: txCount / 10 })

    if (txCount >= 50) list.push({ id: 'tx_50', icon: '📊', name: 'Controle Total', desc: 'Registrou 50 transações', unlocked: true })
    else list.push({ id: 'tx_50', icon: '📊', name: 'Controle Total', desc: `${txCount}/50 transações`, unlocked: false, progress: txCount / 50 })

    if (txCount >= 100) list.push({ id: 'tx_100', icon: '🏆', name: 'Centenário', desc: 'Registrou 100 transações', unlocked: true })
    else list.push({ id: 'tx_100', icon: '🏆', name: 'Centenário', desc: `${txCount}/100 transações`, unlocked: false, progress: txCount / 100 })

    // Budget
    if (budgetCount >= 1) list.push({ id: 'first_budget', icon: '🎯', name: 'Planejador', desc: 'Criou seu primeiro orçamento', unlocked: true })
    else list.push({ id: 'first_budget', icon: '🎯', name: 'Planejador', desc: 'Crie seu primeiro orçamento', unlocked: false })

    // Goals
    if (goalsDone >= 1) list.push({ id: 'first_goal', icon: '⭐', name: 'Sonho Realizado', desc: 'Completou sua primeira meta', unlocked: true })
    else list.push({ id: 'first_goal', icon: '⭐', name: 'Sonho Realizado', desc: 'Complete sua primeira meta', unlocked: false })

    // Categories
    if (catCount >= 3) list.push({ id: 'custom_cats', icon: '🎨', name: 'Personalizado', desc: 'Criou 3 categorias customizadas', unlocked: true })
    else list.push({ id: 'custom_cats', icon: '🎨', name: 'Personalizado', desc: `${catCount}/3 categorias criadas`, unlocked: false, progress: catCount / 3 })

    // Accounts
    if (accountCount >= 2) list.push({ id: 'multi_acc', icon: '🏦', name: 'Diversificado', desc: 'Tem 2+ contas financeiras', unlocked: true })
    else list.push({ id: 'multi_acc', icon: '🏦', name: 'Diversificado', desc: 'Cadastre 2+ contas', unlocked: false })

    // Tags
    if (tagCount >= 3) list.push({ id: 'tagger', icon: '🏷️', name: 'Organizador', desc: 'Criou 3+ tags', unlocked: true })
    else list.push({ id: 'tagger', icon: '🏷️', name: 'Organizador', desc: `${tagCount}/3 tags criadas`, unlocked: false, progress: tagCount / 3 })

    // Cards
    if (cardCount >= 1) list.push({ id: 'first_card', icon: '💳', name: 'Cartão na Mão', desc: 'Cadastrou seu primeiro cartão', unlocked: true })
    else list.push({ id: 'first_card', icon: '💳', name: 'Cartão na Mão', desc: 'Cadastre um cartão de crédito', unlocked: false })

    return list
  }, [data.transactions, data.goals, data.budgets, data.categories, data.accounts, data.tags, data.creditCards])

  // ── Smart Notifications ──
  const getNotifications = useCallback(() => {
    const notifs = []
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Budget alerts
    ;(data.budgets || []).forEach(budget => {
      const cat = (data.categories || []).find(c => c.id === budget.categoryId)
      const expenses = data.transactions
        .filter(t => {
          const d = new Date(t.date + 'T00:00:00')
          return t.type === 'expense' && t.category === budget.categoryId && d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
        .reduce((s, t) => s + t.amount, 0)
      const pct = (expenses / budget.limit) * 100
      if (pct >= 100) {
        notifs.push({ id: `bgt_${budget.id}`, type: 'danger', icon: '🚨', title: `${cat?.name || 'Categoria'} estourou!`, desc: `Orçamento ultrapassado em ${Math.round(pct - 100)}%`, time: 'Agora' })
      } else if (pct >= 80) {
        notifs.push({ id: `bgt_${budget.id}`, type: 'warning', icon: '⚠️', title: `${cat?.name || 'Categoria'} quase no limite`, desc: `${Math.round(pct)}% do orçamento usado`, time: 'Agora' })
      }
    })

    // Goals almost done
    ;(data.goals || []).forEach(goal => {
      const pct = ((goal.currentAmount || 0) / goal.targetAmount) * 100
      if (pct >= 90 && pct < 100) {
        notifs.push({ id: `goal_${goal.id}`, type: 'success', icon: '🎯', title: `${goal.name} quase lá!`, desc: `${Math.round(pct)}% da meta alcançada`, time: 'Agora' })
      } else if (pct >= 100) {
        notifs.push({ id: `goal_done_${goal.id}`, type: 'success', icon: '🎉', title: `${goal.name} concluída!`, desc: 'Parabéns! Meta alcançada', time: 'Agora' })
      }
    })

    // Credit card due dates
    ;(data.creditCards || []).forEach(card => {
      if (card.dueDay) {
        const dueDate = new Date(currentYear, currentMonth, card.dueDay)
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))
        if (daysUntilDue >= 0 && daysUntilDue <= 5) {
          notifs.push({ id: `card_${card.id}`, type: 'warning', icon: '💳', title: `Fatura ${card.name}`, desc: daysUntilDue === 0 ? 'Vence hoje!' : `Vence em ${daysUntilDue} dia(s)`, time: `${daysUntilDue}d` })
        }
      }
    })

    // Recurring transactions reminder
    const recurringTxs = data.transactions.filter(t => t.isRecurring && !t._generatedFrom)
    recurringTxs.forEach(tx => {
      const txDate = new Date(tx.date + 'T00:00:00')
      const nextDate = new Date(currentYear, currentMonth, txDate.getDate())
      const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24))
      if (daysUntil >= 0 && daysUntil <= 3) {
        notifs.push({ id: `rec_${tx.id}`, type: 'info', icon: '🔄', title: tx.description || 'Conta recorrente', desc: daysUntil === 0 ? 'Vence hoje' : `Vence em ${daysUntil} dia(s)`, time: `${daysUntil}d` })
      }
    })

    return notifs
  }, [data.budgets, data.categories, data.transactions, data.goals, data.creditCards])

  // ── Recurring Transactions Management ──
  const getRecurringTransactions = useCallback(() => {
    return data.transactions.filter(t => t.isRecurring && !t._generatedFrom)
  }, [data.transactions])

  const toggleRecurring = useCallback((id) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t =>
        t.id === id ? { ...t, isRecurringPaused: !t.isRecurringPaused } : t
      )
    }))
  }, [])

  // ── Annual Summary ──
  const getAnnualSummary = useCallback((year) => {
    const months = []
    for (let m = 0; m < 12; m++) {
      const txs = data.transactions.filter(t => {
        const d = new Date(t.date + 'T00:00:00')
        return d.getMonth() === m && d.getFullYear() === year
      })
      const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      months.push({ month: m, income, expense, balance: income - expense })
    }
    const totalIncome = months.reduce((s, m) => s + m.income, 0)
    const totalExpense = months.reduce((s, m) => s + m.expense, 0)
    const bestMonth = months.reduce((best, m) => m.balance > best.balance ? m : best, months[0])
    const worstMonth = months.reduce((worst, m) => m.balance < worst.balance ? m : worst, months[0])
    return { months, totalIncome, totalExpense, totalBalance: totalIncome - totalExpense, bestMonth, worstMonth }
  }, [data.transactions])

  const clearAllData = useCallback(() => {
    setData({
      transactions: [],
      categories: defaultCategories,
      banks: [],
      currency: 'BRL',
      budgets: [],
      goals: [],
      creditCards: [],
      accounts: [DEFAULT_ACCOUNT],
      tags: [],
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
    accounts: data.accounts || [DEFAULT_ACCOUNT],
    tags: data.tags || [],
    addTransaction, updateTransaction, deleteTransaction,
    addCategory, deleteCategory, updateCategory,
    setCurrency,
    connectBank, disconnectBank,
    addBudget, updateBudget, deleteBudget,
    addGoal, updateGoal, deleteGoal,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addAccount, updateAccount, deleteAccount,
    transferBetweenAccounts, getAccountBalance,
    addTag, deleteTag, updateTag,
    getBalance, getTransactionsByMonth, getExpensesByCategory,
    getCardInvoice, processRecurring,
    exportData, importData,
    clearAllData,
    // Phase 5
    achievements,
    getNotifications,
    getRecurringTransactions, toggleRecurring,
    getAnnualSummary,
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
