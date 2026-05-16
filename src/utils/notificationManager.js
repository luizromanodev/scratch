/**
 * FinFlow Notification Manager
 * Handles push notifications for PWA — works on mobile and desktop
 */

const NOTIF_SETTINGS_KEY = 'finflow_notification_settings'
const NOTIF_LOG_KEY = 'finflow_notification_log'
const NOTIF_CHECK_KEY = 'finflow_last_notif_check'

// Default notification preferences
const DEFAULT_SETTINGS = {
  enabled: false,
  transactions: {
    onExpense: true,
    onIncome: true,
    minAmount: 0, // only notify above this amount (0 = all)
  },
  recurring: {
    enabled: true,
    daysBefore: 1, // notify X days before due date
    salaryReminder: true,
    foodVoucherReminder: true,
  },
  budgets: {
    enabled: true,
    threshold: 80, // percentage to trigger alert
  },
  creditCards: {
    enabled: true,
    daysBefore: 3, // notify X days before due date
  },
  goals: {
    enabled: true,
    onMilestone: true, // 50%, 75%, 90%, 100%
  },
  schedule: {
    morningDigest: false, // daily summary at 8am
    morningHour: 8,
  },
  quiet: {
    enabled: false,
    startHour: 22,
    endHour: 7,
  },
}

// ── Settings Persistence ──
export function getNotificationSettings() {
  try {
    const saved = localStorage.getItem(NOTIF_SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge with defaults to handle new settings
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch (e) {
    console.error('Error loading notification settings:', e)
  }
  return { ...DEFAULT_SETTINGS }
}

export function saveNotificationSettings(settings) {
  try {
    localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Error saving notification settings:', e)
  }
}

// ── Permission Management ──
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return { granted: false, reason: 'unsupported' }
  }

  if (Notification.permission === 'granted') {
    return { granted: true }
  }

  if (Notification.permission === 'denied') {
    return { granted: false, reason: 'denied' }
  }

  try {
    const result = await Notification.requestPermission()
    return { granted: result === 'granted', reason: result }
  } catch {
    return { granted: false, reason: 'error' }
  }
}

// ── Notification Deduplication Log ──
function getNotifLog() {
  try {
    const saved = localStorage.getItem(NOTIF_LOG_KEY)
    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function markNotified(key) {
  const log = getNotifLog()
  log[key] = Date.now()
  // Clean entries older than 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  for (const k of Object.keys(log)) {
    if (log[k] < thirtyDaysAgo) delete log[k]
  }
  localStorage.setItem(NOTIF_LOG_KEY, JSON.stringify(log))
}

function wasNotified(key) {
  const log = getNotifLog()
  return !!log[key]
}

function wasNotifiedToday(key) {
  const log = getNotifLog()
  if (!log[key]) return false
  const today = new Date().toISOString().split('T')[0]
  const notifDate = new Date(log[key]).toISOString().split('T')[0]
  return today === notifDate
}

// ── Quiet Hours Check ──
function isQuietTime(settings) {
  if (!settings.quiet?.enabled) return false
  const hour = new Date().getHours()
  const start = settings.quiet.startHour
  const end = settings.quiet.endHour
  if (start > end) {
    // e.g., 22:00 to 07:00
    return hour >= start || hour < end
  }
  return hour >= start && hour < end
}

// ── Fire Notification ──
export function fireNotification(title, body, options = {}) {
  const settings = getNotificationSettings()

  if (!settings.enabled) return false
  if (isQuietTime(settings)) return false
  if (getNotificationPermission() !== 'granted') return false

  // Deduplication
  const dedupKey = options.dedupKey || `${title}_${body}`
  if (options.deduplicateDaily && wasNotifiedToday(dedupKey)) return false
  if (options.deduplicateOnce && wasNotified(dedupKey)) return false

  try {
    // Try using service worker for persistent notifications (mobile)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          vibrate: [100, 50, 100],
          tag: options.tag || dedupKey,
          renotify: false,
          data: {
            url: options.url || '/',
            timestamp: Date.now(),
          },
          actions: options.actions || [],
          ...options.nativeOptions,
        })
      }).catch(() => {
        // Fallback to basic notification
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          tag: options.tag || dedupKey,
        })
      })
    } else {
      // Fallback to basic Notification API
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag: options.tag || dedupKey,
      })
    }

    markNotified(dedupKey)
    return true
  } catch (e) {
    console.warn('Failed to fire notification:', e)
    return false
  }
}

// ── Transaction Notifications ──
export function notifyTransaction(transaction, settings = null) {
  settings = settings || getNotificationSettings()
  if (!settings.enabled) return

  const { type, amount, description, category } = transaction
  const isExpense = type === 'expense'
  const isIncome = type === 'income'

  // Check individual toggles
  if (isExpense && !settings.transactions?.onExpense) return
  if (isIncome && !settings.transactions?.onIncome) return

  // Minimum amount filter
  if (settings.transactions?.minAmount > 0 && amount < settings.transactions.minAmount) return

  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount)

  if (isExpense) {
    fireNotification(
      '💸 Nova compra registrada',
      `${description || category || 'Despesa'} — ${formattedAmount}`,
      {
        tag: `tx_expense_${transaction.id}`,
        url: '/transactions',
        dedupKey: `tx_${transaction.id}`,
        deduplicateOnce: true,
      }
    )
  } else if (isIncome) {
    // Detect salary / food voucher by description or category
    const desc = (description || '').toLowerCase()
    const isSalary = desc.includes('salário') || desc.includes('salario') || desc.includes('pgto') || category === 'salary'
    const isFoodVoucher = desc.includes('vale alimentação') || desc.includes('vale alimentacao') || desc.includes('vale refeição') || desc.includes('vale refeicao') || desc.includes('vr') || desc.includes('va') || category === 'food_voucher'

    let title = '💰 Receita recebida'
    let emoji = '💰'
    if (isSalary) {
      title = '🤑 Salário recebido!'
      emoji = '🤑'
    } else if (isFoodVoucher) {
      title = '🍽️ Vale Alimentação recebido!'
      emoji = '🍽️'
    }

    fireNotification(
      title,
      `${description || 'Receita'} — ${formattedAmount}`,
      {
        tag: `tx_income_${transaction.id}`,
        url: '/transactions',
        dedupKey: `tx_${transaction.id}`,
        deduplicateOnce: true,
      }
    )
  }
}

// ── Recurring Transaction Reminders ──
export function checkRecurringReminders(transactions) {
  const settings = getNotificationSettings()
  if (!settings.enabled || !settings.recurring?.enabled) return

  const today = new Date()
  const daysBefore = settings.recurring.daysBefore || 1
  const recurring = transactions.filter(t => t.isRecurring && !t._generatedFrom && !t.isRecurringPaused)

  recurring.forEach(tx => {
    const txDate = new Date(tx.date + 'T00:00:00')
    const nextDate = new Date(today.getFullYear(), today.getMonth(), txDate.getDate())
    if (nextDate < today) nextDate.setMonth(nextDate.getMonth() + 1)

    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24))

    if (daysUntil >= 0 && daysUntil <= daysBefore) {
      const desc = tx.description || 'Conta recorrente'
      const isIncome = tx.type === 'income'
      const formattedAmount = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(tx.amount)

      const descLower = desc.toLowerCase()
      const isSalary = descLower.includes('salário') || descLower.includes('salario')
      const isFoodVoucher = descLower.includes('vale alimentação') || descLower.includes('vale alimentacao') || descLower.includes('vr') || descLower.includes('va')

      let title = '🔄 Conta recorrente'
      if (isIncome && isSalary) title = '💰 Salário chegando!'
      else if (isIncome && isFoodVoucher) title = '🍽️ VA chegando!'
      else if (isIncome) title = '💰 Receita prevista'
      else title = '📅 Conta a vencer'

      const timeMsg = daysUntil === 0 ? 'hoje' : daysUntil === 1 ? 'amanhã' : `em ${daysUntil} dia(s)`

      const dedupKey = `rec_${tx.id}_${today.toISOString().split('T')[0]}`

      fireNotification(
        title,
        `${desc} — ${formattedAmount} vence ${timeMsg}`,
        {
          tag: `recurring_${tx.id}`,
          url: '/recurring',
          dedupKey,
          deduplicateDaily: true,
        }
      )
    }
  })
}

// ── Budget Alert Notifications ──
export function checkBudgetNotifications(budgets, categories, transactions) {
  const settings = getNotificationSettings()
  if (!settings.enabled || !settings.budgets?.enabled) return

  const threshold = settings.budgets.threshold || 80
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  budgets.forEach(budget => {
    const cat = categories.find(c => c.id === budget.categoryId)
    const expenses = transactions
      .filter(t => {
        const d = new Date(t.date + 'T00:00:00')
        return t.type === 'expense' && t.category === budget.categoryId &&
          d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((s, t) => s + t.amount, 0)

    const pct = (expenses / budget.limit) * 100
    const dedupKey = `budget_${budget.id}_${currentMonth}_${currentYear}`

    if (pct >= 100) {
      fireNotification(
        '🚨 Orçamento estourado!',
        `${cat?.name || 'Categoria'} ultrapassou o limite em ${Math.round(pct - 100)}%`,
        { tag: `budget_exceeded_${budget.id}`, url: '/budgets', dedupKey: dedupKey + '_exceeded', deduplicateDaily: true }
      )
    } else if (pct >= threshold) {
      fireNotification(
        '⚠️ Orçamento quase no limite',
        `${cat?.name || 'Categoria'} em ${Math.round(pct)}% do orçamento`,
        { tag: `budget_warning_${budget.id}`, url: '/budgets', dedupKey: dedupKey + '_warning', deduplicateDaily: true }
      )
    }
  })
}

// ── Credit Card Due Date Notifications ──
export function checkCreditCardNotifications(creditCards) {
  const settings = getNotificationSettings()
  if (!settings.enabled || !settings.creditCards?.enabled) return

  const today = new Date()
  const daysBefore = settings.creditCards.daysBefore || 3
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  creditCards.forEach(card => {
    if (!card.dueDay) return

    const dueDate = new Date(currentYear, currentMonth, card.dueDay)
    const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24))

    if (daysUntil >= 0 && daysUntil <= daysBefore) {
      const timeMsg = daysUntil === 0 ? 'Vence hoje!' : daysUntil === 1 ? 'Vence amanhã!' : `Vence em ${daysUntil} dias`
      const dedupKey = `cc_${card.id}_${today.toISOString().split('T')[0]}`

      fireNotification(
        '💳 Fatura do cartão',
        `${card.name}: ${timeMsg}`,
        { tag: `cc_due_${card.id}`, url: `/card/${card.id}`, dedupKey, deduplicateDaily: true }
      )
    }
  })
}

// ── Goal Milestone Notifications ──
export function checkGoalNotifications(goals) {
  const settings = getNotificationSettings()
  if (!settings.enabled || !settings.goals?.enabled) return

  goals.forEach(goal => {
    const pct = ((goal.currentAmount || 0) / goal.targetAmount) * 100
    const milestones = [100, 90, 75, 50]

    for (const milestone of milestones) {
      if (pct >= milestone) {
        const dedupKey = `goal_${goal.id}_${milestone}`
        const wasAlready = wasNotified(dedupKey)
        if (!wasAlready) {
          const emoji = milestone === 100 ? '🎉' : milestone >= 90 ? '🔥' : milestone >= 75 ? '💪' : '📈'
          fireNotification(
            milestone === 100 ? `${emoji} Meta alcançada!` : `${emoji} Meta ${milestone}% completa!`,
            `${goal.name}: ${Math.round(pct)}% concluída`,
            { tag: `goal_${goal.id}`, url: '/goals', dedupKey, deduplicateOnce: true }
          )
        }
        break // Only notify for the highest milestone reached
      }
    }
  })
}

// ── Master Check (runs all periodic checks) ──
export function runNotificationChecks(data) {
  const settings = getNotificationSettings()
  if (!settings.enabled) return

  // Only run checks every 30 minutes max
  const lastCheck = localStorage.getItem(NOTIF_CHECK_KEY)
  const now = Date.now()
  if (lastCheck && (now - parseInt(lastCheck)) < 30 * 60 * 1000) return
  localStorage.setItem(NOTIF_CHECK_KEY, String(now))

  const { transactions = [], budgets = [], categories = [], creditCards = [], goals = [] } = data

  checkRecurringReminders(transactions)
  checkBudgetNotifications(budgets, categories, transactions)
  checkCreditCardNotifications(creditCards)
  checkGoalNotifications(goals)
}

// ── Test Notification ──
export function sendTestNotification() {
  return fireNotification(
    '🔔 FinFlow — Teste',
    'Suas notificações estão funcionando perfeitamente!',
    {
      tag: 'test_notification',
      url: '/',
      dedupKey: `test_${Date.now()}`,
    }
  )
}
