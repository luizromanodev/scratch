import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should login and set user data', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    
    act(() => {
      result.current.login('João Silva', 'joao@exemplo.com')
    })

    expect(result.current.user.name).toBe('João Silva')
    expect(result.current.user.email).toBe('joao@exemplo.com')
    expect(result.current.user.id).toBeDefined()
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('finflow_user')).toBeTruthy()
  })

  it('should logout and clear user data', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    
    act(() => {
      result.current.login('João Silva', 'joao@exemplo.com')
    })
    
    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('finflow_user')).toBeNull()
  })
})
