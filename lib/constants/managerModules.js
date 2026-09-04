// Modules délégables à un compte "manager" — doivent rester en phase avec le
// mapping module -> collections dans habitatgnweb/firestore.rules
// (isAdminOrManager). Un admin n'est jamais restreint par cette liste.
//
// `actions` liste les catégories d'action déléguables à l'intérieur de ce
// module (voir MANAGER_ACTIONS) — masquage purement côté interface, la
// vraie barrière sécurisée reste le module entier (Firestore + garde SSR).
export const MANAGER_ACTIONS = [
  { key: 'process', label: 'Traiter (approuver, modifier, changer le statut)' },
  { key: 'payments', label: 'Paiements' },
  { key: 'delete', label: 'Supprimer' },
]

export const MANAGER_MODULES = [
  { key: 'agents', label: 'Agents', actions: ['process', 'payments'] },
  { key: 'properties', label: 'Gestion locative', actions: ['process', 'payments', 'delete'] },
  { key: 'workers', label: 'Ouvriers', actions: ['process', 'payments'] },
  { key: 'reservations', label: 'Réservations', actions: ['process'] },
  { key: 'services', label: 'Services', actions: ['process'] },
  { key: 'messages', label: 'Messages', actions: ['process', 'delete'] },
  { key: 'leads', label: 'Demandes de visite', actions: ['process', 'delete'] },
  { key: 'marketplace', label: 'Marketplace', actions: ['process', 'delete'] },
  { key: 'advertising', label: 'Publicité', actions: ['process', 'delete'] },
  { key: 'partners', label: 'Partenaires', actions: ['process', 'delete'] },
  { key: 'careers', label: 'Carrières', actions: ['process'] },
]

export const ALL_MANAGER_MODULE_KEYS = MANAGER_MODULES.map((m) => m.key)

// Un manager a accès à `action` dans `module` si :
// - `permissions` est absent -> accès total (défaut historique, inchangé)
// - le module n'est pas dans `permissions` -> aucun accès
// - le module est présent mais aucune entrée "module:*" n'existe encore ->
//   accès total à ce module (accordé avant l'existence des actions fines)
// - sinon, seules les entrées "module:action" explicitement présentes
//   donnent accès
export function hasManagerAction(permissions, moduleKey, action) {
  if (!permissions) return true
  if (!permissions.includes(moduleKey)) return false
  const hasAnyActionEntry = permissions.some((p) => p.startsWith(`${moduleKey}:`))
  if (!hasAnyActionEntry) return true
  return permissions.includes(`${moduleKey}:${action}`)
}
