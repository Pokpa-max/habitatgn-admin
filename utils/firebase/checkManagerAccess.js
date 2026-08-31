import { dbAdmin } from '@/lib/firebase-admin/admin_config'

// Barrière SSR par module pour les pages manager-accessibles. Un admin a
// toujours accès. Un manager doit avoir `module` dans son `permissions`
// Firestore — champ absent = compte créé avant cette fonctionnalité =
// accès total, même défaut que firestore.rules -> managerPermissions().
export async function hasManagerModuleAccess(uid, userType, module) {
  if (userType === 'admin') return true
  if (userType !== 'manager') return false
  const snap = await dbAdmin.collection('users').doc(uid).get()
  const permissions = snap.data()?.permissions
  if (!permissions) return true
  return permissions.includes(module)
}
