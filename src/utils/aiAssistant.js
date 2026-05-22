/**
 * FinFlow AI Financial Assistant
 * Uses Google Gemini API for conversational financial analysis & app support
 */

const CHAT_HISTORY_STORAGE = 'finflow_ai_chat_history'
const USER_API_KEY_STORAGE = 'finflow_user_api_key'

// ── API Key Management ──
export function getApiKey() {
  // User-provided key takes priority (stored in their browser)
  const userKey = localStorage.getItem(USER_API_KEY_STORAGE)
  if (userKey) return userKey
  // Fall back to env var (if deployer set one)
  return import.meta.env.VITE_GEMINI_API_KEY || ''
}

export function setUserApiKey(key) {
  if (key) {
    localStorage.setItem(USER_API_KEY_STORAGE, key.trim())
  } else {
    localStorage.removeItem(USER_API_KEY_STORAGE)
  }
}

export function getUserApiKey() {
  return localStorage.getItem(USER_API_KEY_STORAGE) || ''
}

// ── Chat History ──
export function getChatHistory() {
  try {
    const saved = localStorage.getItem(CHAT_HISTORY_STORAGE)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function saveChatHistory(messages) {
  try {
    // Keep only the last 100 messages to save space
    const trimmed = messages.slice(-100)
    localStorage.setItem(CHAT_HISTORY_STORAGE, JSON.stringify(trimmed))
  } catch { /* silent */ }
}

export function clearChatHistory() {
  localStorage.removeItem(CHAT_HISTORY_STORAGE)
}

// ── Build Financial Context for the AI ──
export function buildFinancialContext(data) {
  const { transactions, categories, budgets, goals, creditCards, accounts, currency } = data
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  // ── Current Month Summary ──
  const currentMonthTxs = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const currentIncome = currentMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const currentExpense = currentMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // ── Last 3 months ──
  const monthsSummary = []
  for (let i = 0; i < 3; i++) {
    let m = currentMonth - i
    let y = currentYear
    if (m < 0) { m += 12; y-- }
    const txs = transactions.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return d.getMonth() === m && d.getFullYear() === y
    })
    const inc = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    monthsSummary.push({
      month: `${monthNames[m]} ${y}`,
      income: inc,
      expense: exp,
      balance: inc - exp,
      txCount: txs.length,
    })
  }

  // ── Top spending categories this month ──
  const catSpending = {}
  currentMonthTxs.filter(t => t.type === 'expense').forEach(t => {
    const cat = categories.find(c => c.id === t.category)
    const name = cat?.name || 'Outros'
    catSpending[name] = (catSpending[name] || 0) + t.amount
  })
  const topCategories = Object.entries(catSpending)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, amount]) => ({ name, amount }))

  // ── Budget status ──
  const budgetStatus = (budgets || []).map(b => {
    const cat = categories.find(c => c.id === b.categoryId)
    const spent = currentMonthTxs
      .filter(t => t.type === 'expense' && t.category === b.categoryId)
      .reduce((s, t) => s + t.amount, 0)
    return {
      category: cat?.name || 'Desconhecida',
      limit: b.limit,
      spent,
      percentage: Math.round((spent / b.limit) * 100),
    }
  })

  // ── Goals ──
  const goalsStatus = (goals || []).map(g => ({
    name: g.name,
    target: g.targetAmount,
    current: g.currentAmount || 0,
    percentage: Math.round(((g.currentAmount || 0) / g.targetAmount) * 100),
  }))

  // ── Credit Cards ──
  const cardsInfo = (creditCards || []).map(c => ({
    name: c.name,
    limit: c.limit || 0,
    currentInvoice: c.currentInvoice || 0,
    dueDay: c.dueDay,
    usage: c.limit ? Math.round(((c.currentInvoice || 0) / c.limit) * 100) : 0,
  }))

  // ── Accounts ──
  const accountsInfo = (accounts || []).map(acc => ({
    name: acc.name,
    type: acc.type,
    initialBalance: acc.initialBalance || 0,
  }))

  // ── Recurring ──
  const recurringTxs = transactions.filter(t => t.isRecurring && !t._generatedFrom)
  const recurringExpenses = recurringTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const recurringIncome = recurringTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)

  // ── Recent transactions (last 15) ──
  const recentTxs = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15)
    .map(t => {
      const cat = categories.find(c => c.id === t.category)
      return {
        date: t.date,
        type: t.type === 'income' ? 'Receita' : 'Despesa',
        category: cat?.name || 'Outros',
        description: t.description || cat?.name || '',
        amount: t.amount,
        isRecurring: t.isRecurring || false,
      }
    })

  const fmt = (v) => `R$ ${v.toFixed(2).replace('.', ',')}`

  return `
## Dados Financeiros do Usuário — FinFlow

### Mês Atual: ${monthNames[currentMonth]} ${currentYear}
- Receitas: ${fmt(currentIncome)}
- Despesas: ${fmt(currentExpense)}
- Saldo: ${fmt(currentIncome - currentExpense)}
- Transações: ${currentMonthTxs.length}

### Resumo dos Últimos 3 Meses
${monthsSummary.map(m => `- ${m.month}: Receita ${fmt(m.income)} | Despesa ${fmt(m.expense)} | Saldo ${fmt(m.balance)} (${m.txCount} transações)`).join('\n')}

### Top Gastos por Categoria (Mês Atual)
${topCategories.length > 0 ? topCategories.map(c => `- ${c.name}: ${fmt(c.amount)}`).join('\n') : '- Nenhum gasto registrado'}

### Orçamentos
${budgetStatus.length > 0 ? budgetStatus.map(b => `- ${b.category}: ${fmt(b.spent)} de ${fmt(b.limit)} (${b.percentage}%)`).join('\n') : '- Nenhum orçamento definido'}

### Metas Financeiras
${goalsStatus.length > 0 ? goalsStatus.map(g => `- ${g.name}: ${fmt(g.current)} de ${fmt(g.target)} (${g.percentage}%)`).join('\n') : '- Nenhuma meta definida'}

### Cartões de Crédito
${cardsInfo.length > 0 ? cardsInfo.map(c => `- ${c.name}: Fatura ${fmt(c.currentInvoice)} | Limite ${fmt(c.limit)} (${c.usage}% usado) | Vencimento dia ${c.dueDay || 'N/A'}`).join('\n') : '- Nenhum cartão cadastrado'}

### Contas/Carteiras
${accountsInfo.map(a => `- ${a.name} (${a.type}) — Saldo inicial: ${fmt(a.initialBalance)}`).join('\n')}

### Recorrentes
- Despesas fixas mensais: ${fmt(recurringExpenses)}
- Receitas fixas mensais: ${fmt(recurringIncome)}
- Total de recorrentes: ${recurringTxs.length}

### Últimas 15 Transações
${recentTxs.map(t => `- ${t.date} | ${t.type} | ${t.category} | ${t.description} | ${fmt(t.amount)}${t.isRecurring ? ' (Recorrente)' : ''}`).join('\n')}

### Estatísticas Gerais
- Total de transações: ${transactions.length}
- Moeda: ${currency}
- Categorias customizadas: ${categories.filter(c => c.id.startsWith('custom_')).length}
`.trim()
}

// ── System Prompt ──
const SYSTEM_PROMPT = `Você é o **FinBot**, o assistente inteligente do FinFlow. Você é amigável, profissional e cumpre dois papéis:
1. **Consultor Financeiro** — expert em finanças pessoais, análise de gastos e planejamento
2. **Suporte do App** — ajuda o usuário a resolver problemas, encontrar funcionalidades e tirar dúvidas sobre o FinFlow

## Seu papel como Consultor Financeiro:
- Analisar os dados financeiros do usuário e fornecer insights personalizados
- Gerar relatórios detalhados quando solicitado
- Dar dicas práticas e acionáveis para melhorar a saúde financeira
- Conversar naturalmente sobre finanças, respondendo dúvidas e sugestões
- Identificar padrões de gastos e oportunidades de economia
- Ajudar com planejamento financeiro e metas

## Seu papel como Suporte do App:
- Ajudar o usuário a encontrar funcionalidades no FinFlow
- Explicar como usar cada recurso do app
- Resolver dúvidas sobre erros ou comportamentos inesperados
- Guiar passo a passo quando o usuário não sabe fazer algo

## Funcionalidades do FinFlow que você conhece:
- **Dashboard (Início)**: Visão geral com saldo, receitas, despesas, gráfico de categorias, contas
- **Transações**: Lista completa com busca, filtros por tipo/categoria, swipe para editar/deletar
- **Adicionar Transação (+)**: Botão central da barra inferior. Campos: tipo (receita/despesa), valor, categoria, data, descrição, conta, tags, recorrência
- **Orçamentos**: Definir limites de gastos por categoria. Acesse via Dashboard > Orçamentos
- **Metas e Cofres**: Criar metas de economia com progresso visual. Acesse via Dashboard > Metas
- **Relatórios**: Gráficos e análises detalhadas. Acesse via Dashboard > Relatórios
- **Recorrentes**: Ver e gerenciar transações que se repetem mensalmente. Acesse via Dashboard > Recorrentes
- **Resumo Anual**: Visão consolidada do ano. Acesse via Dashboard > Resumo Anual
- **Conquistas/Badges**: Sistema de gamificação. Acesse via Dashboard > Conquistas
- **Cartões de Crédito**: Cadastrar cartões, ver faturas e limites. Acesse via Bancos (barra inferior)
- **Contas/Carteiras**: Gerenciar múltiplas contas. Acesse via Perfil > Contas
- **Categorias**: Criar e personalizar categorias. Acesse via Perfil > Categorias
- **Notificações Push**: Alertas de transações, contas e vencimentos. Acesse via Perfil > Notificações
- **FinBot IA (este chat)**: Assistente inteligente. Acesse via botão ✨ no Dashboard ou Perfil > FinBot IA
- **Exportar/Importar dados**: Backup em JSON. Acesse via Perfil > Exportar/Importar
- **Tema Escuro/Claro**: Acesse via Perfil > Tema
- **Cor do App**: Personalizar cor principal. Acesse via Perfil > Cor do App
- **Busca Global**: Lupa no topo do Dashboard para buscar transações
- **Instalação PWA**: O app pode ser instalado na tela inicial do celular para funcionar offline

## Problemas comuns e soluções:
- **"Não consigo adicionar transação"**: Verifique se preencheu o valor e a categoria. Toque no botão + na barra inferior.
- **"Minhas transações sumiram"**: Os dados ficam no localStorage. Limpar dados do navegador apaga tudo. Recomende exportar backup.
- **"O app está lento"**: Muitas transações podem afetar. Sugira limpar transações antigas ou exportar backup.
- **"Notificações não funcionam"**: Precisa permitir no navegador e instalar como PWA na tela inicial.
- **"Como instalar no celular?"**: Abra no Chrome > menu ⋮ > "Adicionar à tela inicial" ou "Instalar app".
- **"Como mudar a cor/tema?"**: Vá em Perfil > Tema (escuro/claro) ou Perfil > Cor do App.
- **"Como criar orçamento?"**: Dashboard > seção Planejamento > Orçamentos > botão +.
- **"Como ver relatórios?"**: Dashboard > seção Planejamento > Relatórios.

## Regras de formatação:
- Use emojis para tornar as respostas mais visuais (mas com moderação)
- Use listas e tópicos para organizar informações
- Formate valores monetários como R$ X.XXX,XX
- Seja conciso mas completo
- Use negrito para destacar pontos importantes
- Quando dar notas ou scores, use de 0 a 10

## Regras de comportamento:
- Sempre fale em Português Brasileiro
- Seja encorajador mas honesto sobre problemas
- Nunca invente dados que não estão no contexto financeiro
- Ofereça sugestões específicas baseadas nos dados reais
- Pergunte sobre as necessidades do usuário para personalizar suas respostas
- Sugira funcionalidades do app quando relevante
- Se o usuário reportar um bug, peça detalhes e sugira soluções
- Se o usuário perguntar algo totalmente fora do escopo (como programação, receitas, etc.), responda brevemente e redirecione educadamente

## Tipos de análise que você pode oferecer:
1. **Relatório Geral**: Visão completa da saúde financeira
2. **Análise de Gastos**: Onde o dinheiro está indo
3. **Comparativo Mensal**: Evolução ao longo dos meses
4. **Dicas de Economia**: Oportunidades de cortar gastos
5. **Planejamento**: Sugestões de metas e orçamentos
6. **Análise de Cartão**: Uso de crédito e faturas
7. **Previsão**: Tendências e projeções baseadas no histórico`

// ── Suggested Quick Prompts ──
export const QUICK_PROMPTS = [
  { icon: '📊', label: 'Relatório geral', prompt: 'Faça um relatório completo da minha situação financeira, incluindo pontos positivos, o que preciso melhorar, e dê uma nota de 0 a 10 para minha saúde financeira.' },
  { icon: '💡', label: 'Dicas de economia', prompt: 'Analise meus gastos e me dê 5 dicas práticas para economizar dinheiro baseado nos meus padrões de consumo.' },
  { icon: '📈', label: 'Comparar meses', prompt: 'Compare meus últimos 3 meses: o que melhorou, o que piorou, e qual a tendência?' },
  { icon: '🎯', label: 'Plano financeiro', prompt: 'Crie um plano financeiro personalizado para eu melhorar minha situação nos próximos 3 meses.' },
  { icon: '💳', label: 'Análise de cartões', prompt: 'Analise o uso dos meus cartões de crédito e me diga se estou usando bem ou se preciso tomar cuidado.' },
  { icon: '🆘', label: 'Ajuda com o app', prompt: 'Preciso de ajuda com o app. Me explique as principais funcionalidades do FinFlow e como usar cada uma.' },
]

// ── Send Message to Gemini API ──
export async function sendMessageToAI(userMessage, chatHistory, financialContext) {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('API_KEY_MISSING')
  }

  // Build conversation contents for Gemini
  const contents = []

  // Add financial context as the first user message (system context)
  contents.push({
    role: 'user',
    parts: [{ text: `[CONTEXTO DO SISTEMA - NÃO REPITA ISSO]\n\n${SYSTEM_PROMPT}\n\n## Dados financeiros atuais do usuário:\n${financialContext}\n\n---\nResponda como FinBot. A próxima mensagem é do usuário.` }]
  })
  contents.push({
    role: 'model',
    parts: [{ text: 'Entendido! Sou o FinBot, assistente do FinFlow. Posso ajudar com análises financeiras, relatórios, dicas e também com dúvidas sobre o app. Como posso ajudar?' }]
  })

  // Add chat history
  chatHistory.forEach(msg => {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })
  })

  // Add the new user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  })

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    if (response.status === 400) throw new Error('API_KEY_INVALID')
    if (response.status === 429) throw new Error('RATE_LIMIT')
    throw new Error(err.error?.message || `API Error: ${response.status}`)
  }

  const result = await response.json()
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) {
    throw new Error('Resposta vazia da IA. Tente novamente.')
  }

  return text
}
