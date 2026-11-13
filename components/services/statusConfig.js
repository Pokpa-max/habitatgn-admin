// Alignés sur les statuts affichés côté site public (page "Mes demandes de service")
// tone est consommé par <StatusPill> pour un rendu identique partout dans l'admin
export const REQUEST_STATUSES = [
  { value: 'pending', label: 'En attente', tone: 'warning' },
  { value: 'confirmed', label: 'Confirmé', tone: 'primary' },
  { value: 'completed', label: 'Terminé', tone: 'success' },
  { value: 'cancelled', label: 'Annulé', tone: 'error' },
]

