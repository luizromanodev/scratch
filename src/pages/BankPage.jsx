import { useState } from 'react'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { formatCurrency } from '../utils/formatCurrency'
import { Link2, Unlink, Shield, Wallet, ChevronRight, X, Check, DollarSign } from 'lucide-react'
import CreditCardsSection from '../components/Bank/CreditCardsSection'
import Modal from '../components/UI/Modal'
import './BankPage.css'

// Brazilian banks catalog — visual data only (no API)
const banksCatalog = [
  { id: 'nubank', name: 'Nubank', color: '#820AD1', logo: 'N' },
  { id: 'inter', name: 'Banco Inter', color: '#FF7A00', logo: 'I' },
  { id: 'itau', name: 'Itaú', color: '#003399', logo: 'I', logoColor: '#FF6600' },
  { id: 'bradesco', name: 'Bradesco', color: '#CC092F', logo: 'B' },
  { id: 'bb', name: 'Banco do Brasil', color: '#FFEF00', logo: 'B', logoColor: '#003399' },
  { id: 'caixa', name: 'Caixa', color: '#005CA9', logo: 'C' },
  { id: 'c6', name: 'C6 Bank', color: '#1A1A1A', logo: 'C6' },
  { id: 'picpay', name: 'PicPay', color: '#21C25E', logo: 'P' },
  { id: 'santander', name: 'Santander', color: '#EC0000', logo: 'S' },
  { id: 'neon', name: 'Neon', color: '#0082FF', logo: 'Ne' },
  { id: 'original', name: 'Banco Original', color: '#00A86B', logo: 'O' },
  { id: 'next', name: 'Next', color: '#00E676', logo: 'Nx' },
]

export default function BankPage() {
  const { banks, accounts, currency, connectBank, disconnectBank, addAccount, updateAccount, getAccountBalance } = useFinance()
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState('banks')

  // Connect flow states
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [connectStep, setConnectStep] = useState(1) // 1=select bank, 2=enter balance, 3=success
  const [selectedBank, setSelectedBank] = useState(null)
  const [inputBalance, setInputBalance] = useState('')
  const [connecting, setConnecting] = useState(false)

  const connectedBankIds = banks.map(b => b.id)

  const startConnect = () => {
    setSelectedBank(null)
    setInputBalance('')
    setConnectStep(1)
    setShowConnectModal(true)
  }

  const selectBank = (bank) => {
    setSelectedBank(bank)
    setConnectStep(2)
  }

  const confirmConnect = async () => {
    if (!selectedBank) return
    const balance = parseFloat(inputBalance) || 0

    setConnecting(true)
    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 1200))

    // 1. Create an Account linked to this bank
    const accountId = `bank_${selectedBank.id}`
    addAccount({
      id: accountId, // Use deterministic ID so we can find it
      name: selectedBank.name,
      type: 'checking',
      icon: 'Wallet',
      color: selectedBank.color,
      initialBalance: balance,
      linkedBankId: selectedBank.id,
    })

    // 2. Save the bank connection
    connectBank({
      ...selectedBank,
      bankName: selectedBank.name,
      bankColor: selectedBank.color,
      balance,
      accountId, // Link to the account
      status: 'connected',
      lastSync: new Date().toISOString(),
    })

    setConnecting(false)
    setConnectStep(3)
    addToast(`${selectedBank.name} conectado com sucesso!`, 'success')
  }

  const handleDisconnect = (bankId) => {
    const bank = banks.find(b => b.id === bankId)
    if (!bank) return
    disconnectBank(bankId)
    addToast(`${bank.bankName} desconectado`, 'info')
  }

  // Get live balance from the linked Account (reflects transactions)
  const getBankLiveBalance = (bank) => {
    const linkedAccount = accounts.find(a => a.linkedBankId === bank.id || a.id === bank.accountId)
    if (!linkedAccount) return bank.balance || 0
    return getAccountBalance(linkedAccount.id)
  }

  const closeAndReset = () => {
    setShowConnectModal(false)
    setConnectStep(1)
    setSelectedBank(null)
    setInputBalance('')
  }

  return (
    <div className="page container">
      <header className="bank-header">
        <h1 className="bank-title">Contas e Cartões</h1>
        <p className="bank-subtitle">Gerencie suas contas bancárias e cartões de crédito</p>
      </header>

      <div className="bank-tabs glass">
        <button
          className={`bank-tab-btn ${activeTab === 'banks' ? 'active' : ''}`}
          onClick={() => setActiveTab('banks')}
        >
          Contas Bancárias
        </button>
        <button
          className={`bank-tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          Cartões de Crédito
        </button>
      </div>

      {activeTab === 'banks' ? (
        <div className="animate-fade-in">
          {/* Security Badge */}
          <div className="bank-security">
            <Shield size={16} />
            <span>Seus dados ficam salvos com segurança</span>
          </div>

          {/* Connected Banks */}
          {banks.length > 0 && (
            <section className="bank-section">
              <h2 className="section-title">Contas Conectadas</h2>
              <div className="bank-list stagger">
                {banks.map(bank => (
                  <div key={bank.id} className="bank-card connected">
                    <div className="bank-avatar" style={{ background: bank.bankColor }}>
                      <span style={{ color: ['bb'].includes(bank.id) ? '#003399' : 'white', fontSize: bank.bankName?.length > 6 ? '0.75rem' : undefined }}>
                        {banksCatalog.find(b => b.id === bank.id)?.logo || bank.bankName?.charAt(0)}
                      </span>
                    </div>
                    <div className="bank-info">
                      <span className="bank-name">{bank.bankName}</span>
                      <span className="bank-balance">{formatCurrency(getBankLiveBalance(bank), currency)}</span>
                    </div>
                    <div className="bank-actions">
                      <button
                        className="bank-unlink-btn"
                        onClick={() => handleDisconnect(bank.id)}
                        aria-label="Desconectar"
                        title="Desconectar conta"
                      >
                        <Unlink size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Add Bank Button */}
          <button className="bank-add-btn" onClick={startConnect}>
            <Link2 size={20} />
            <span>Conectar Conta Bancária</span>
          </button>

          {/* How It Works */}
          <div className="bank-info-card">
            <h3>💡 Como funciona?</h3>
            <p>Adicione suas contas bancárias informando o saldo atual. Conforme você registra transações no FinFlow, o saldo é atualizado automaticamente.</p>
            <div className="bank-info-steps">
              <div className="bank-step">
                <span className="bank-step-num">1</span>
                <span>Selecione seu banco</span>
              </div>
              <div className="bank-step">
                <span className="bank-step-num">2</span>
                <span>Informe o saldo atual</span>
              </div>
              <div className="bank-step">
                <span className="bank-step-num">3</span>
                <span>Acompanhe tudo aqui!</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CreditCardsSection />
      )}

      {/* ── Connect Bank Modal ── */}
      <Modal isOpen={showConnectModal} onClose={closeAndReset} title={
        connectStep === 1 ? 'Selecione seu Banco' :
        connectStep === 2 ? `Conectar ${selectedBank?.name}` :
        'Conta Conectada!'
      }>
        <div className="connect-flow">
          {/* Step 1: Select Bank */}
          {connectStep === 1 && (
            <div className="connect-step-1">
              <p className="connect-desc">Escolha o banco que deseja adicionar ao FinFlow</p>
              <div className="bank-select-grid">
                {banksCatalog.filter(b => !connectedBankIds.includes(b.id)).map(bank => (
                  <button
                    key={bank.id}
                    className="bank-select-item"
                    onClick={() => selectBank(bank)}
                  >
                    <div className="bank-select-avatar" style={{ background: bank.color }}>
                      <span style={{ color: bank.logoColor || 'white' }}>{bank.logo}</span>
                    </div>
                    <span className="bank-select-name">{bank.name}</span>
                    <ChevronRight size={16} className="bank-select-arrow" />
                  </button>
                ))}
              </div>
              {banksCatalog.filter(b => !connectedBankIds.includes(b.id)).length === 0 && (
                <div className="connect-empty">
                  <p>Todos os bancos já estão conectados! 🎉</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Enter Balance */}
          {connectStep === 2 && selectedBank && (
            <div className="connect-step-2">
              <div className="connect-bank-preview">
                <div className="bank-select-avatar large" style={{ background: selectedBank.color }}>
                  <span style={{ color: selectedBank.logoColor || 'white' }}>{selectedBank.logo}</span>
                </div>
                <span className="connect-bank-name">{selectedBank.name}</span>
              </div>

              <div className="connect-balance-form">
                <label className="connect-label">
                  <DollarSign size={16} />
                  Qual o saldo atual da sua conta?
                </label>
                <div className="connect-input-wrapper">
                  <span className="connect-currency">R$</span>
                  <input
                    type="number"
                    className="connect-balance-input"
                    placeholder="0,00"
                    value={inputBalance}
                    onChange={e => setInputBalance(e.target.value)}
                    autoFocus
                    step="0.01"
                  />
                </div>
                <p className="connect-hint">
                  Informe o saldo que aparece no app do seu banco agora.
                  Conforme você adicionar receitas e despesas, o saldo será atualizado automaticamente.
                </p>
              </div>

              <div className="connect-actions">
                <button className="connect-back" onClick={() => setConnectStep(1)}>
                  Voltar
                </button>
                <button
                  className="connect-confirm"
                  onClick={confirmConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <span className="connect-loading">Conectando...</span>
                  ) : (
                    <>
                      <Link2 size={18} />
                      <span>Conectar Conta</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {connectStep === 3 && selectedBank && (
            <div className="connect-step-3">
              <div className="connect-success-icon">
                <Check size={32} />
              </div>
              <h3 className="connect-success-title">{selectedBank.name} conectado!</h3>
              <p className="connect-success-desc">
                Sua conta foi adicionada com saldo de {formatCurrency(parseFloat(inputBalance) || 0, currency)}.
                As transações que você registrar serão refletidas nessa conta.
              </p>
              <button className="connect-done" onClick={closeAndReset}>
                Entendido
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
