// Alignés sur les statuts affichés côté site public (page "Mes demandes de service")
export const REQUEST_STATUSES = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
]

export const STATUS_LABELS = REQUEST_STATUSES.reduce((acc, s) => {
  acc[s.value] = s.label
  return acc
}, {})
