// Modules délégables à un compte "manager" — doivent rester en phase avec le
// mapping module -> collections dans habitatgnweb/firestore.rules
// (isAdminOrManager). Un admin n'est jamais restreint par cette liste.
export const MANAGER_MODULES = [
  { key: 'agents', label: 'Agents' },
  { key: 'properties', label: 'Gestion locative' },
  { key: 'workers', label: 'Ouvriers' },
  { key: 'reservations', label: 'Réservations' },
  { key: 'services', label: 'Services' },
  { key: 'messages', label: 'Messages' },
]

export const ALL_MANAGER_MODULE_KEYS = MANAGER_MODULES.map((m) => m.key)
