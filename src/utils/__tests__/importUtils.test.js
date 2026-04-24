import { describe, it, expect } from 'vitest'
import { parseImportFile } from '../importUtils'

describe('importUtils', () => {
  it('should parse CSV content correctly', async () => {
    const csvContent = `Data,Descrição,Valor
2026-04-20,Uber,-35.50
2026-04-21,Salário,5000.00
`
    // Mock File object
    const file = new File([csvContent], 'extrato.csv', { type: 'text/csv' })

    const transactions = await parseImportFile(file)
    
    expect(transactions).toHaveLength(2)
    
    expect(transactions[0].type).toBe('expense')
    expect(transactions[0].amount).toBe(35.50)
    expect(transactions[0].description).toBe('Uber')
    expect(transactions[0].date).toBe('2026-04-20')

    expect(transactions[1].type).toBe('income')
    expect(transactions[1].amount).toBe(5000.00)
    expect(transactions[1].description).toBe('Salário')
    expect(transactions[1].date).toBe('2026-04-21')
  })

  it('should parse basic OFX content correctly', async () => {
    const ofxContent = `
      <STMTTRN>
        <TRNTYPE>CREDIT
        <DTPOSTED>20260424120000[-03:EST]
        <TRNAMT>1500.00
        <MEMO>PIX Recebido
      </STMTTRN>
      <STMTTRN>
        <TRNTYPE>DEBIT
        <DTPOSTED>20260425120000[-03:EST]
        <TRNAMT>-45.00
        <MEMO>Padaria
      </STMTTRN>
    `
    const file = new File([ofxContent], 'extrato.ofx', { type: 'application/x-ofx' })

    const transactions = await parseImportFile(file)

    expect(transactions).toHaveLength(2)
    
    expect(transactions[0].type).toBe('income')
    expect(transactions[0].amount).toBe(1500.00)
    expect(transactions[0].description).toBe('PIX Recebido')
    expect(transactions[0].date).toBe('2026-04-24')

    expect(transactions[1].type).toBe('expense')
    expect(transactions[1].amount).toBe(45.00)
    expect(transactions[1].description).toBe('Padaria')
    expect(transactions[1].date).toBe('2026-04-25')
  })

  it('should reject unsupported files', async () => {
    const file = new File(['text'], 'document.txt', { type: 'text/plain' })
    await expect(parseImportFile(file)).rejects.toThrow('Formato não suportado')
  })
})
