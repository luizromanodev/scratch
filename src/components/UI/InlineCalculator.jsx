import { useState, useMemo, useCallback } from 'react'
import './InlineCalculator.css'

const BUTTONS = [
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '-'],
  ['.', '0', '⌫', '+'],
]

function evaluate(expr) {
  try {
    // Replace display operators with JS operators
    const sanitized = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/,/g, '.')
    // Safe eval using Function constructor (no access to globals)
    const result = new Function(`'use strict'; return (${sanitized})`)()
    if (typeof result !== 'number' || !isFinite(result)) return null
    return Math.round(result * 100) / 100 // Round to 2 decimal places
  } catch {
    return null
  }
}

export default function InlineCalculator({ expression, onExpressionChange, onConfirm }) {
  const isOperator = (ch) => ['+', '-', '×', '÷'].includes(ch)

  const result = useMemo(() => {
    if (!expression) return null
    // Only show result when there's an operator in the expression
    const hasOp = /[+\-×÷]/.test(expression.replace(/^-/, ''))
    if (!hasOp) return null
    return evaluate(expression)
  }, [expression])

  const handleButton = useCallback((btn) => {
    if (btn === '⌫') {
      onExpressionChange(expression.slice(0, -1))
      return
    }
    if (btn === '=' || btn === 'Enter') {
      if (result !== null) {
        onConfirm(result)
      }
      return
    }

    // Prevent double operators
    const lastChar = expression.slice(-1)
    if (isOperator(btn) && isOperator(lastChar)) {
      onExpressionChange(expression.slice(0, -1) + btn)
      return
    }

    // Prevent multiple dots in the same number
    if (btn === '.') {
      const parts = expression.split(/[+\-×÷]/)
      const lastPart = parts[parts.length - 1]
      if (lastPart.includes('.')) return
    }

    onExpressionChange(expression + btn)
  }, [expression, result, onExpressionChange, onConfirm])

  const hasResult = result !== null

  return (
    <div className="calc-container animate-fade-in-up">
      {/* Result Preview */}
      {hasResult && (
        <div className="calc-preview">
          <span className="calc-preview-label">Resultado:</span>
          <span className="calc-preview-value">{result.toFixed(2).replace('.', ',')}</span>
        </div>
      )}

      {/* Button Grid */}
      <div className="calc-grid">
        {BUTTONS.map((row, ri) => (
          row.map((btn) => (
            <button
              key={`${ri}-${btn}`}
              className={`calc-btn ${isOperator(btn) ? 'operator' : ''} ${btn === '⌫' ? 'delete' : ''}`}
              onClick={() => handleButton(btn)}
              type="button"
            >
              {btn}
            </button>
          ))
        ))}
        <button
          className={`calc-btn confirm ${hasResult ? 'active' : ''}`}
          onClick={() => handleButton('=')}
          disabled={!hasResult}
          type="button"
          style={{ gridColumn: 'span 4' }}
        >
          = Usar resultado
        </button>
      </div>
    </div>
  )
}
