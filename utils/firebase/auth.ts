import { authAdmin } from '@/lib/firebase-admin/admin_config'

export const setCustomUserClaims = async (uid: string, type: string) => {
  await authAdmin.setCustomUserClaims(uid, { userType: type })
}
