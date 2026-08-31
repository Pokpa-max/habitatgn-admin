import { authAdmin } from '@/lib/firebase-admin/admin_config'

// Vérifie que la requête vient bien d'un compte admin/manager authentifié —
// même contrôle que pages/api/login.ts, à réutiliser dans toute route API
// qui exécute une action sensible (créer un compte, poser des custom claims,
// activer/désactiver un compte...). Retourne le token décodé si valide,
// sinon null (l'appelant renvoie alors 401/403).
export async function verifyAdminRequest(req) {
  const token = req.headers.authorization
  if (!token) return null

  try {
    const decodedToken = await authAdmin.verifyIdToken(token)
    const isAdmin = decodedToken.userType === 'admin' || decodedToken.userType === 'manager'
    return isAdmin ? decodedToken : null
  } catch (e) {
    return null
  }
}
