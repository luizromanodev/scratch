import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { getRelativeDate, groupByDate } from '../dateUtils'

describe('dateUtils', () => {
  beforeAll(() => {
    // Mock date to 2026-04-24T12:00:00Z for relative date tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-24T12:00:00Z'))
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('getRelativeDate', () => {
    it('should return "Hoje" for current date', () => {
      expect(getRelativeDate('2026-04-24')).toBe('Hoje')
    })

    it('should return "Ontem" for yesterday', () => {
      expect(getRelativeDate('2026-04-23')).toBe('Ontem')
    })

    it('should return the formatted date for older dates', () => {
      // O formato pode variar dependendo do locale ('pt-BR'), vamos checar partes
      const result = getRelativeDate('2026-04-20')
      expect(result).toContain('20')
      expect(result).toMatch(/abr/i)
    })
  })

  describe('groupByDate', () => {
    it('should group transactions by date', () => {
      const txs = [
        { id: 1, date: '2026-04-24', amount: 10 },
        { id: 2, date: '2026-04-24', amount: 20 },
        { id: 3, date: '2026-04-23', amount: 30 }
      ]

      const grouped = groupByDate(txs)
      
      expect(grouped).toHaveLength(2)
      expect(grouped[0].date).toBe('2026-04-24')
      expect(grouped[0].items).toHaveLength(2)
      expect(grouped[1].date).toBe('2026-04-23')
      expect(grouped[1].items).toHaveLength(1)
    })

    it('should return empty array for empty input', () => {
      expect(groupByDate([])).toEqual([])
    })
  })
})
