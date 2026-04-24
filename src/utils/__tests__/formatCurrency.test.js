import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../formatCurrency'

describe('formatCurrency', () => {
  it('should format BRL correctly', () => {
    const result = formatCurrency(1500.5, 'BRL')
    // A string exata pode variar por conta de espaços non-breaking (char 160), então removemos espaços
    expect(result.replace(/\s/g, '')).toMatch(/R\$1\.500,50|R\$1500,50/)
  })

  it('should format USD correctly', () => {
    // 1500.5 * 0.19 (USD rate) = 285.095 -> 285.10
    const result = formatCurrency(1500.5, 'USD')
    expect(result.replace(/\s/g, '')).toMatch(/US\$285\.10|\$285\.10/)
  })

  it('should handle zero correctly', () => {
    const result = formatCurrency(0, 'BRL')
    expect(result.replace(/\s/g, '')).toMatch(/R\$0,00/)
  })

  it('should format negative numbers correctly', () => {
    const result = formatCurrency(-50.25, 'BRL')
    expect(result.replace(/\s/g, '')).toMatch(/-R\$50,25|-50,25/) // O sinal de menos pode estar antes ou depois do R$
  })
})
