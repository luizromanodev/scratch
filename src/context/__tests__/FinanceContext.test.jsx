import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { FinanceProvider, useFinance } from '../FinanceContext'

describe('FinanceContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should calculate balance correctly based on transactions', () => {
    const { result } = renderHook(() => useFinance(), { wrapper: FinanceProvider })
    
    act(() => {
      // Income
      result.current.addTransaction({
        type: 'income',
        amount: 2000,
        category: 'salary',
        description: 'Salário',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false
      })
      
      // Expense
      result.current.addTransaction({
        type: 'expense',
        amount: 500,
        category: 'food',
        description: 'Mercado',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false
      })
    })

    const currentDate = new Date()
    const balance = result.current.getBalance(currentDate.getMonth(), currentDate.getFullYear())
    
    expect(balance.income).toBe(2000)
    expect(balance.expense).toBe(500)
    expect(balance.balance).toBe(1500)
  })

  it('should split installments correctly', () => {
    const { result } = renderHook(() => useFinance(), { wrapper: FinanceProvider })
    
    act(() => {
      // Compra de 1200 em 3x
      result.current.addTransaction({
        type: 'expense',
        amount: 1200,
        category: 'electronics',
        description: 'Celular',
        date: '2026-04-24', // Data fixa
        isRecurring: false,
        installments: 3
      })
    })

    const txs = result.current.transactions
    expect(txs).toHaveLength(3)
    
    // As transações devem ser de 400 cada
    expect(txs[0].amount).toBe(400)
    expect(txs[0].description).toBe('Celular (1/3)')
    
    expect(txs[1].amount).toBe(400)
    expect(txs[1].description).toBe('Celular (2/3)')
    
    expect(txs[2].amount).toBe(400)
    expect(txs[2].description).toBe('Celular (3/3)')
  })

  it('should manage budgets correctly', () => {
    const { result } = renderHook(() => useFinance(), { wrapper: FinanceProvider })
    
    act(() => {
      result.current.addBudget({ categoryId: 'food', limit: 800 })
    })
    
    expect(result.current.budgets).toHaveLength(1)
    expect(result.current.budgets[0].limit).toBe(800)

    const budgetId = result.current.budgets[0].id

    act(() => {
      result.current.updateBudget(budgetId, { limit: 1000 })
    })

    expect(result.current.budgets[0].limit).toBe(1000)

    act(() => {
      result.current.deleteBudget(budgetId)
    })

    expect(result.current.budgets).toHaveLength(0)
  })

  it('should manage goals correctly', () => {
    const { result } = renderHook(() => useFinance(), { wrapper: FinanceProvider })
    
    act(() => {
      result.current.addGoal({ name: 'Carro', targetAmount: 50000 })
    })
    
    expect(result.current.goals).toHaveLength(1)
    expect(result.current.goals[0].name).toBe('Carro')

    const goalId = result.current.goals[0].id

    act(() => {
      result.current.updateGoal(goalId, { currentAmount: 5000 })
    })

    expect(result.current.goals[0].currentAmount).toBe(5000)
  })
})
