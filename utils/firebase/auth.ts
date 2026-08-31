import { authAdmin } from '@/lib/firebase-admin/admin_config'

// `role` est le seul claim lu par les règles Firestore de habitatgnweb
// (isAdmin()) — ne poser que `userType` (comme avant) laisse le compte
// incapable d'écrire quoi que ce soit de protégé côté site public.
export const setCustomUserClaims = async (uid: string, type: string) => {
  await authAdmin.setCustomUserClaims(uid, { userType: type, role: type })
}
