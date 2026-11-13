import { authAdmin, dbAdmin } from '@/lib/firebase-admin/admin_config'

// Vérifie que la requête vient bien d'un compte admin/manager authentifié —
// même contrôle que pages/api/login.ts, à réutiliser dans toute route API
// qui exécute une action sensible (créer un compte, poser des custom claims,
// activer/désactiver un compte...). Retourne le token décodé si valide,
// sinon null (l'appelant renvoie alors 401/403).
export async function verifyAdminRequest(req) {
  const token = req.headers.authorization
  if (!token) return null

  try {
    const decodedToken = await authAdmin.verifyIdToken(token, true)
    const userType = decodedToken.userType || decodedToken.role
    const isAdmin = userType === 'admin' || userType === 'manager'
    if (!isAdmin) return null

    const userSnap = await dbAdmin.collection('users').doc(decodedToken.uid).get()
    if (!userSnap.exists) return null

    const userData = userSnap.data()
    if (userData?.isAvailable !== true) return null
    if (userType === 'manager' && !Array.isArray(userData.permissions)) return null

    return {
      ...decodedToken,
      userType,
      permissions: userType === 'manager' ? userData.permissions : undefined,
    }
  } catch (e) {
    return null
  }
}
