import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/UI/Toast'
import {
  getChatHistory, saveChatHistory, clearChatHistory,
  buildFinancialContext, sendMessageToAI, QUICK_PROMPTS,
  getApiKey, getUserApiKey, setUserApiKey,
} from '../utils/aiAssistant'
import {
  ArrowLeft, Send, Sparkles, Trash2,
  ChevronDown, Loader2, Lightbulb, KeyRound,
} from 'lucide-react'
import './AIAssistantPage.css'

// Simple markdown renderer for AI messages
function renderMarkdown(text) {
  if (!text) return ''
  let html = text
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Unordered list items
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')
  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>)(?:<br \/>)?/g, '$1')
  html = html.replace(/((?:<li>.*?<\/li>)+)/g, '<ul>$1</ul>')
  return `<p>${html}</p>`
}

export default function AIAssistantPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { user } = useAuth()
  const finance = useFinance()

  const [messages, setMessages] = useState(() => getChatHistory())
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(() => !!getApiKey())
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKeySetup, setShowKeySetup] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const chatContainerRef = useRef(null)

  // Hide bottom nav when this page is active
  useEffect(() => {
    const bottomNav = document.getElementById('bottom-nav')
    if (bottomNav) bottomNav.style.display = 'none'
    return () => {
      if (bottomNav) bottomNav.style.display = ''
    }
  }, [])

  // Financial context (memoized)
  const financialContext = useMemo(() => {
    return buildFinancialContext({
      transactions: finance.transactions,
      categories: finance.categories,
      budgets: finance.budgets,
      goals: finance.goals,
      creditCards: finance.creditCards,
      accounts: finance.accounts,
      currency: finance.currency,
    })
  }, [finance.transactions, finance.categories, finance.budgets, finance.goals, finance.creditCards, finance.accounts, finance.currency])

  // Save messages when they change
  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Scroll detection for "scroll to bottom" button
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100)
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = useCallback(async (messageText) => {
    const text = (messageText || input).trim()
    if (!text || isLoading) return

    // Add user message
    const userMsg = { role: 'user', content: text, timestamp: Date.now() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      // Only send last 20 messages as history context
      const historyForAI = updatedMessages.slice(-20)
      const aiResponse = await sendMessageToAI(text, historyForAI.slice(0, -1), financialContext)

      const aiMsg = { role: 'assistant', content: aiResponse, timestamp: Date.now() }
      setMessages(prev => [...prev, aiMsg])
    } catch (error) {
      let errorMsg = 'Desculpe, ocorreu um erro. Tente novamente.'
      if (error.message === 'API_KEY_MISSING') {
        errorMsg = '🔑 Nenhuma chave de API configurada. Vá em **Configurar API Key** para adicionar sua chave do Google Gemini.'
        setHasApiKey(false)
      } else if (error.message === 'API_KEY_INVALID') {
        errorMsg = '🔑 Chave de API inválida. Verifique sua chave nas configurações.'
      } else if (error.message === 'RATE_LIMIT') {
        errorMsg = 'Limite de requisições atingido. Aguarde um momento e tente novamente.'
      }

      const errMsg = { role: 'assistant', content: `⚠️ ${errorMsg}`, timestamp: Date.now(), isError: true }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [input, isLoading, messages, financialContext])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    clearChatHistory()
    setMessages([])
    addToast('Histórico de chat limpo', 'info')
  }

  const firstName = user?.name?.split(' ')[0] || 'Usuário'

  return (
    <div className="ai-page">
      {/* Header */}
      <header className="ai-header">
        <button className="ai-back-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
        <div className="ai-header-info">
          <div className="ai-avatar">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="ai-header-title">FinBot</h1>
            <span className="ai-header-status">
              {isLoading ? 'Analisando...' : 'Assistente & Suporte'}
            </span>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="ai-clear-btn" onClick={handleClearChat} aria-label="Limpar chat" title="Limpar histórico">
            <Trash2 size={16} />
          </button>
        )}
        <button
          className="ai-clear-btn"
          onClick={() => setShowKeySetup(!showKeySetup)}
          aria-label="Configurar API Key"
          title="Configurar API Key"
          style={!hasApiKey ? { color: 'var(--warning-500)' } : {}}
        >
          <KeyRound size={16} />
        </button>
      </header>

      {/* API Key Setup Panel */}
      {showKeySetup && (
        <div className="ai-key-setup">
          <p className="ai-key-setup-title">🔑 Chave da API Gemini</p>
          <p className="ai-key-setup-desc">
            O FinBot usa a API do Google Gemini. Crie sua chave grátis em{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
              Google AI Studio
            </a>
          </p>
          <div className="ai-key-setup-form">
            <input
              type="password"
              placeholder="Cole sua API key aqui..."
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              className="ai-key-input"
            />
            <button
              className="ai-key-save-btn"
              disabled={!apiKeyInput.trim()}
              onClick={() => {
                setUserApiKey(apiKeyInput.trim())
                setHasApiKey(true)
                setShowKeySetup(false)
                setApiKeyInput('')
                addToast('API Key salva com sucesso!', 'success')
              }}
            >
              Salvar
            </button>
          </div>
          {getUserApiKey() && (
            <button
              className="ai-key-remove-btn"
              onClick={() => {
                setUserApiKey(null)
                setHasApiKey(!!import.meta.env.VITE_GEMINI_API_KEY)
                setApiKeyInput('')
                addToast('API Key removida', 'info')
              }}
            >
              Remover chave salva
            </button>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div className="ai-chat-area" ref={chatContainerRef}>
        {/* Welcome State */}
        {messages.length === 0 && (
          <div className="ai-welcome">
            <div className="ai-welcome-avatar">
              <Sparkles size={32} />
            </div>
            <h2 className="ai-welcome-title">Olá, {firstName}! 👋</h2>
            <p className="ai-welcome-desc">
              Sou o <strong>FinBot</strong>, seu assistente inteligente.
              Posso analisar suas finanças, gerar relatórios, dar dicas e também te ajudar com qualquer dúvida sobre o app.
            </p>

            {/* Quick Prompts */}
            <div className="ai-quick-prompts">
              <p className="ai-quick-label">
                <Lightbulb size={14} /> Sugestões rápidas
              </p>
              <div className="ai-prompts-grid">
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    className="ai-prompt-chip"
                    onClick={() => handleSend(p.prompt)}
                    disabled={isLoading}
                  >
                    <span className="ai-prompt-icon">{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ai-msg-${msg.role} ${msg.isError ? 'ai-msg-error' : ''}`}>
            <div className="ai-msg-avatar">
              {msg.role === 'user' ? (
                <span className="ai-user-initial">{firstName.charAt(0)}</span>
              ) : (
                <Sparkles size={14} />
              )}
            </div>
            <div className="ai-msg-bubble">
              {msg.role === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <div
                  className="ai-msg-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              )}
              <span className="ai-msg-time">
                {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="ai-message ai-msg-assistant">
            <div className="ai-msg-avatar">
              <Sparkles size={14} />
            </div>
            <div className="ai-msg-bubble ai-typing">
              <div className="ai-typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button className="ai-scroll-btn" onClick={scrollToBottom}>
          <ChevronDown size={18} />
        </button>
      )}

      {/* Quick prompts when in chat */}
      {messages.length > 0 && !isLoading && (
        <div className="ai-chat-prompts">
          {QUICK_PROMPTS.slice(0, 3).map((p, i) => (
            <button
              key={i}
              className="ai-mini-prompt"
              onClick={() => handleSend(p.prompt)}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="ai-input-area">
        <div className="ai-input-wrapper">
          <textarea
            ref={inputRef}
            className="ai-input"
            placeholder="Pergunte sobre finanças ou peça ajuda..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className={`ai-send-btn ${input.trim() ? 'active' : ''}`}
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            aria-label="Enviar"
          >
            {isLoading ? <Loader2 size={18} className="ai-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="ai-disclaimer">
          FinBot pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  )
}
