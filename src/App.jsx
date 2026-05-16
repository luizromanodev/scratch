import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider } from './context/FinanceContext'
import { ToastProvider } from './components/UI/Toast'
import Layout from './components/Layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import AddTransactionPage from './pages/AddTransactionPage'
import BankPage from './pages/BankPage'
import ProfilePage from './pages/ProfilePage'
import BudgetsPage from './pages/BudgetsPage'
import GoalsPage from './pages/GoalsPage'
import ReportsPage from './pages/ReportsPage'
import CategoriesPage from './pages/CategoriesPage'
import AccountsPage from './pages/AccountsPage'
import CreditCardDetailPage from './pages/CreditCardDetailPage'
import AchievementsPage from './pages/AchievementsPage'
import RecurringPage from './pages/RecurringPage'
import AnnualSummaryPage from './pages/AnnualSummaryPage'
import NotificationsPage from './pages/NotificationsPage'
import AIAssistantPage from './pages/AIAssistantPage'
import CryptoPage from './pages/CryptoPage'

import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoutes() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <FinanceProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/add" element={<AddTransactionPage />} />
          <Route path="/banks" element={<BankPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/card/:id" element={<CreditCardDetailPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/recurring" element={<RecurringPage />} />
          <Route path="/annual" element={<AnnualSummaryPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/ai" element={<AIAssistantPage />} />
          <Route path="/crypto" element={<CryptoPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </FinanceProvider>
  )
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  )
}

import ErrorBoundary from './components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
