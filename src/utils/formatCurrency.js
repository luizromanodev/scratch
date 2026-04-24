// Currency configurations with symbols and exchange rates (approximate)
export const currencies = {
  BRL: { symbol: 'R$', name: 'Real Brasileiro', locale: 'pt-BR', rate: 1 },
  USD: { symbol: '$', name: 'Dólar Americano', locale: 'en-US', rate: 0.19 },
  EUR: { symbol: '€', name: 'Euro', locale: 'de-DE', rate: 0.17 },
  GBP: { symbol: '£', name: 'Libra Esterlina', locale: 'en-GB', rate: 0.15 },
  JPY: { symbol: '¥', name: 'Iene Japonês', locale: 'ja-JP', rate: 28.5 },
  ARS: { symbol: 'ARS$', name: 'Peso Argentino', locale: 'es-AR', rate: 175.0 },
}

export function formatCurrency(value, currencyCode = 'BRL') {
  const currency = currencies[currencyCode] || currencies.BRL
  const convertedValue = value * currency.rate

  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedValue)
}

export function formatCompact(value, currencyCode = 'BRL') {
  const currency = currencies[currencyCode] || currencies.BRL
  const convertedValue = value * currency.rate

  if (Math.abs(convertedValue) >= 1000000) {
    return `${currency.symbol} ${(convertedValue / 1000000).toFixed(1)}M`
  }
  if (Math.abs(convertedValue) >= 1000) {
    return `${currency.symbol} ${(convertedValue / 1000).toFixed(1)}K`
  }
  return formatCurrency(value, currencyCode)
}
