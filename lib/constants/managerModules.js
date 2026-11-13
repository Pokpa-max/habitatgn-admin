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
  { key: 'workers', label: 'Artisans', actions: ['process', 'payments'] },
  { key: 'reservations', label: 'Réservations', actions: ['process'] },
  { key: 'services', label: 'Demandes de service', actions: ['process'] },
  { key: 'messages', label: 'Messages', actions: ['process', 'delete'] },
  { key: 'leads', label: 'Demandes de visite', actions: ['process', 'delete'] },
  { key: 'marketplace', label: 'Marketplace', actions: ['process', 'delete'] },
  { key: 'advertising', label: 'Publicité', actions: ['process', 'delete'] },
  { key: 'partners', label: 'Partenaires', actions: ['process', 'delete'] },
  { key: 'careers', label: 'Carrières', actions: ['process'] },
]

export const ALL_MANAGER_MODULE_KEYS = MANAGER_MODULES.map((m) => m.key)
export const ALL_MANAGER_PERMISSIONS = MANAGER_MODULES.flatMap((module) => [
  module.key,
  ...module.actions.map((action) => `${module.key}:${action}`),
])

// Un manager a accès à `action` dans `module` si :
// - `permissions` absent ou malformed -> aucun accès
// - le module n'est pas dans `permissions` -> aucun accès
// - une action n'est autorisée que si son entrée "module:action" est explicite
export function hasManagerAction(permissions, moduleKey, action) {
  if (!Array.isArray(permissions)) return false
  if (!permissions.includes(moduleKey)) return false
  return permissions.includes(`${moduleKey}:${action}`)
}

// Cases cochées (modules + "module:action") correspondant au tableau brut
// `permissions` d'un manager. Champ absent = accès total (défaut historique).
export function permissionsToSelection(permissions) {
  const perms = Array.isArray(permissions) ? permissions : []
  const next = new Set()
  MANAGER_MODULES.forEach((module) => {
    if (!perms.includes(module.key)) return
    next.add(module.key)
    module.actions.forEach((action) => {
      if (hasManagerAction(perms, module.key, action)) next.add(`${module.key}:${action}`)
    })
  })
  return next
}
