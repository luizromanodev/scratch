const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const shortMonths = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
]

const weekDays = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
]

export function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate()
  const month = months[date.getMonth()]
  return `${day} de ${month}`
}

export function formatDateShort(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

export function formatDateFull(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const weekDay = weekDays[date.getDay()]
  return `${weekDay}, ${day} de ${month} de ${year}`
}

export function getMonthName(monthIndex) {
  return months[monthIndex]
}

export function getShortMonthName(monthIndex) {
  return shortMonths[monthIndex]
}

export function getToday() {
  return new Date().toISOString().split('T')[0]
}

export function getCurrentMonth() {
  return new Date().getMonth()
}

export function getCurrentYear() {
  return new Date().getFullYear()
}

export function isToday(dateStr) {
  return dateStr === getToday()
}

export function isThisMonth(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
}

export function getRelativeDate(dateStr) {
  const today = getToday()
  if (dateStr === today) return 'Hoje'

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem'

  return formatDate(dateStr)
}

export function groupByDate(items) {
  const groups = {}
  items.forEach(item => {
    const key = item.date
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: getRelativeDate(date),
      items
    }))
}
