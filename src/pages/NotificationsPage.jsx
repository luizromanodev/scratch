import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../components/UI/Toast'
import {
  getNotificationSettings,
  saveNotificationSettings,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '../utils/notificationManager'
import {
  ArrowLeft, Bell, BellOff, BellRing, ShoppingCart, Banknote,
  Repeat, CreditCard, Target, PieChart, Moon, Volume2, VolumeX,
  Send, ChevronDown, ChevronUp, Smartphone, AlertTriangle, Check,
  Clock,
} from 'lucide-react'
import './NotificationsPage.css'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [settings, setSettings] = useState(getNotificationSettings)
  const [permission, setPermission] = useState(getNotificationPermission)
  const [expandedSections, setExpandedSections] = useState({
    transactions: true,
    recurring: true,
    budgets: false,
    creditCards: false,
    goals: false,
    schedule: false,
    quiet: false,
  })

  useEffect(() => {
    saveNotificationSettings(settings)
  }, [settings])

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      const parts = path.split('.')
      let target = newSettings
      for (let i = 0; i < parts.length - 1; i++) {
        target[parts[i]] = { ...target[parts[i]] }
        target = target[parts[i]]
      }
      target[parts[parts.length - 1]] = value
      return newSettings
    })
  }

  const handleEnableNotifications = async () => {
    if (permission === 'denied') {
      addToast('Notificações foram bloqueadas. Habilite nas configurações do navegador.', 'error', 5000)
      return
    }

    const result = await requestNotificationPermission()
    setPermission(getNotificationPermission())

    if (result.granted) {
      updateSetting('enabled', true)
      addToast('Notificações ativadas! 🔔', 'success')
    } else {
      addToast('Permissão de notificação negada.', 'error')
    }
  }

  const handleDisable = () => {
    updateSetting('enabled', false)
    addToast('Notificações desativadas', 'info')
  }

  const handleTestNotification = () => {
    const sent = sendTestNotification()
    if (sent) {
      addToast('Notificação de teste enviada!', 'success')
    } else {
      addToast('Não foi possível enviar. Verifique as permissões.', 'error')
    }
  }

  const renderToggle = (value, onChange) => (
    <button
      className={`toggle-switch ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
      role="switch"
      aria-checked={value}
    >
      <div className="toggle-thumb" />
    </button>
  )

  const PermissionBanner = () => {
    if (permission === 'unsupported') {
      return (
        <div className="notif-banner notif-banner-error">
          <AlertTriangle size={20} />
          <div>
            <strong>Navegador não suportado</strong>
            <p>Seu navegador não suporta notificações push. Use Chrome, Edge ou Firefox.</p>
          </div>
        </div>
      )
    }

    if (permission === 'denied') {
      return (
        <div className="notif-banner notif-banner-error">
          <BellOff size={20} />
          <div>
            <strong>Notificações bloqueadas</strong>
            <p>Acesse as configurações do navegador para desbloquear notificações para este site.</p>
          </div>
        </div>
      )
    }

    if (!settings.enabled) {
      return (
        <div className="notif-banner notif-banner-info">
          <Bell size={20} />
          <div>
            <strong>Notificações desativadas</strong>
            <p>Ative para receber alertas de compras, salários, contas e mais.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="notif-banner notif-banner-success">
        <BellRing size={20} />
        <div>
          <strong>Notificações ativas</strong>
          <p>Você receberá alertas no celular e no desktop.</p>
        </div>
      </div>
    )
  }

  const SectionHeader = ({ icon: Icon, title, sectionKey, color }) => (
    <button
      className="notif-section-header"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="notif-section-left">
        <div className="notif-section-icon" style={{ background: color + '18', color }}>
          <Icon size={18} />
        </div>
        <span>{title}</span>
      </div>
      {expandedSections[sectionKey] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>
  )

  return (
    <div className="page container">
      <header className="notif-page-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="notif-page-title">Notificações</h1>
          <p className="notif-page-subtitle">Push notifications no celular</p>
        </div>
      </header>

      {/* Permission Banner */}
      <PermissionBanner />

      {/* Main Enable Toggle */}
      <div className="notif-main-toggle">
        <div className="notif-main-toggle-info">
          <Bell size={22} />
          <div>
            <span className="notif-main-label">Ativar notificações</span>
            <span className="notif-main-desc">
              {settings.enabled ? 'Recebendo alertas' : 'Notificações desligadas'}
            </span>
          </div>
        </div>
        {settings.enabled ? (
          <button
            className={`toggle-switch on`}
            onClick={handleDisable}
            role="switch"
            aria-checked={true}
          >
            <div className="toggle-thumb" />
          </button>
        ) : (
          <button
            className={`toggle-switch`}
            onClick={handleEnableNotifications}
            role="switch"
            aria-checked={false}
          >
            <div className="toggle-thumb" />
          </button>
        )}
      </div>

      {settings.enabled && (
        <div className="notif-settings-body stagger">
          {/* ── Transactions ── */}
          <div className="notif-section">
            <SectionHeader
              icon={ShoppingCart}
              title="Transações"
              sectionKey="transactions"
              color="#6C5CE7"
            />
            {expandedSections.transactions && (
              <div className="notif-section-content">
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Ao registrar compra</span>
                    <span className="notif-row-desc">Notificar quando adicionar uma despesa</span>
                  </div>
                  {renderToggle(settings.transactions.onExpense, (v) => updateSetting('transactions.onExpense', v))}
                </div>
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Ao receber receita</span>
                    <span className="notif-row-desc">Salário, VA, VR, freelance, etc</span>
                  </div>
                  {renderToggle(settings.transactions.onIncome, (v) => updateSetting('transactions.onIncome', v))}
                </div>
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Valor mínimo</span>
                    <span className="notif-row-desc">Só notificar acima de R$ {settings.transactions.minAmount || 0}</span>
                  </div>
                  <select
                    className="notif-select"
                    value={settings.transactions.minAmount}
                    onChange={e => updateSetting('transactions.minAmount', Number(e.target.value))}
                  >
                    <option value={0}>Todos</option>
                    <option value={10}>R$ 10+</option>
                    <option value={50}>R$ 50+</option>
                    <option value={100}>R$ 100+</option>
                    <option value={500}>R$ 500+</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── Recurring ── */}
          <div className="notif-section">
            <SectionHeader
              icon={Repeat}
              title="Contas Recorrentes"
              sectionKey="recurring"
              color="#74B9FF"
            />
            {expandedSections.recurring && (
              <div className="notif-section-content">
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Lembrete de vencimento</span>
                    <span className="notif-row-desc">Avisar antes de contas vencerem</span>
                  </div>
                  {renderToggle(settings.recurring.enabled, (v) => updateSetting('recurring.enabled', v))}
                </div>
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Antecedência</span>
                    <span className="notif-row-desc">Avisar quantos dias antes</span>
                  </div>
                  <select
                    className="notif-select"
                    value={settings.recurring.daysBefore}
                    onChange={e => updateSetting('recurring.daysBefore', Number(e.target.value))}
                  >
                    <option value={0}>No dia</option>
                    <option value={1}>1 dia antes</option>
                    <option value={2}>2 dias antes</option>
                    <option value={3}>3 dias antes</option>
                    <option value={5}>5 dias antes</option>
                    <option value={7}>1 semana antes</option>
                  </select>
                </div>
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">🤑 Lembrete de salário</span>
                    <span className="notif-row-desc">Aviso quando o dia do salário se aproxima</span>
                  </div>
                  {renderToggle(settings.recurring.salaryReminder, (v) => updateSetting('recurring.salaryReminder', v))}
                </div>
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">🍽️ Lembrete de VA/VR</span>
                    <span className="notif-row-desc">Aviso de Vale Alimentação/Refeição</span>
                  </div>
                  {renderToggle(settings.recurring.foodVoucherReminder, (v) => updateSetting('recurring.foodVoucherReminder', v))}
                </div>
              </div>
            )}
          </div>

          {/* ── Budgets ── */}
          <div className="notif-section">
            <SectionHeader
              icon={PieChart}
              title="Orçamentos"
              sectionKey="budgets"
              color="#E17055"
            />
            {expandedSections.budgets && (
              <div className="notif-section-content">
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Alertas de orçamento</span>
                    <span className="notif-row-desc">Quando orçamento se aproximar do limite</span>
                  </div>
                  {renderToggle(settings.budgets.enabled, (v) => updateSetting('budgets.enabled', v))}
                </div>
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Limite de alerta</span>
                    <span className="notif-row-desc">Avisar ao atingir {settings.budgets.threshold}%</span>
                  </div>
                  <select
                    className="notif-select"
                    value={settings.budgets.threshold}
                    onChange={e => updateSetting('budgets.threshold', Number(e.target.value))}
                  >
                    <option value={50}>50%</option>
                    <option value={70}>70%</option>
                    <option value={80}>80%</option>
                    <option value={90}>90%</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── Credit Cards ── */}
          <div className="notif-section">
            <SectionHeader
              icon={CreditCard}
              title="Cartões de Crédito"
              sectionKey="creditCards"
              color="#FD79A8"
            />
            {expandedSections.creditCards && (
              <div className="notif-section-content">
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Vencimento da fatura</span>
                    <span className="notif-row-desc">Aviso antes da fatura vencer</span>
                  </div>
                  {renderToggle(settings.creditCards.enabled, (v) => updateSetting('creditCards.enabled', v))}
                </div>
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Antecedência</span>
                    <span className="notif-row-desc">Dias antes do vencimento</span>
                  </div>
                  <select
                    className="notif-select"
                    value={settings.creditCards.daysBefore}
                    onChange={e => updateSetting('creditCards.daysBefore', Number(e.target.value))}
                  >
                    <option value={1}>1 dia antes</option>
                    <option value={2}>2 dias antes</option>
                    <option value={3}>3 dias antes</option>
                    <option value={5}>5 dias antes</option>
                    <option value={7}>1 semana antes</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── Goals ── */}
          <div className="notif-section">
            <SectionHeader
              icon={Target}
              title="Metas"
              sectionKey="goals"
              color="#00B894"
            />
            {expandedSections.goals && (
              <div className="notif-section-content">
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Marcos de progresso</span>
                    <span className="notif-row-desc">Notificar em 50%, 75%, 90% e 100%</span>
                  </div>
                  {renderToggle(settings.goals.onMilestone, (v) => updateSetting('goals.onMilestone', v))}
                </div>
              </div>
            )}
          </div>

          {/* ── Quiet Hours ── */}
          <div className="notif-section">
            <SectionHeader
              icon={Moon}
              title="Horário Silencioso"
              sectionKey="quiet"
              color="#636E72"
            />
            {expandedSections.quiet && (
              <div className="notif-section-content">
                <div className="notif-row">
                  <div className="notif-row-info">
                    <span className="notif-row-label">Modo silencioso</span>
                    <span className="notif-row-desc">Sem notificações durante um período</span>
                  </div>
                  {renderToggle(settings.quiet.enabled, (v) => updateSetting('quiet.enabled', v))}
                </div>
                {settings.quiet.enabled && (
                  <div className="notif-row notif-quiet-hours">
                    <div className="notif-quiet-time">
                      <label>Das</label>
                      <select
                        className="notif-select"
                        value={settings.quiet.startHour}
                        onChange={e => updateSetting('quiet.startHour', Number(e.target.value))}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div className="notif-quiet-time">
                      <label>Até</label>
                      <select
                        className="notif-select"
                        value={settings.quiet.endHour}
                        onChange={e => updateSetting('quiet.endHour', Number(e.target.value))}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Test Notification ── */}
          <button className="notif-test-btn" onClick={handleTestNotification}>
            <Send size={18} />
            <span>Enviar notificação de teste</span>
          </button>

          {/* ── Install Hint ── */}
          <div className="notif-install-hint">
            <Smartphone size={18} />
            <div>
              <strong>Dica: instale o app</strong>
              <p>Para receber notificações no celular, adicione o FinFlow à tela inicial do seu dispositivo.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
