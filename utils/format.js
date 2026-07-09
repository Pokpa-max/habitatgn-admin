export const formatGNF = (value) => `${Number(value || 0).toLocaleString('fr-FR')} GNF`

export const currentPeriod = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const formatPeriodLabel = (period) => {
  if (!period) return ''
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
