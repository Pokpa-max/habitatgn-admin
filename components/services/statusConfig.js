export const REQUEST_STATUSES = [
  { value: 'pending', label: 'En attente' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'done', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
]

export const STATUS_LABELS = REQUEST_STATUSES.reduce((acc, s) => {
  acc[s.value] = s.label
  return acc
}, {})
