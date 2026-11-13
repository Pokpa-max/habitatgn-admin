import { setAuthCookies } from 'next-firebase-auth'
import initAuth from 'utils/firebase/initAuth'
import { authAdmin, dbAdmin } from '../../lib/firebase-admin/admin_config'

initAuth()

const handler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  try {
    const token = req.headers.authorization
    if (typeof token !== 'string' || !token) {
      return res.status(401).json({ error: 'Authentification requise.' })
    }

    const decodedToken = await authAdmin.verifyIdToken(token, true)
    const isAdmin =
      decodedToken.userType === 'admin' || decodedToken.userType === 'manager'

      if (isAdmin) {
        // Check if user is active in Firestore
        const userDoc = await dbAdmin.collection('users').doc(decodedToken.uid).get()
        
        if (!userDoc.exists) {
           return res.status(403).json({ error: "Utilisateur introuvable." })
        }

        const userData = userDoc.data()
        
        if (!userData?.isAvailable) {
           return res.status(403).json({ error: "Votre compte est désactivé. Veuillez contacter l'administrateur." })
        }

        await setAuthCookies(req, res)
      } else {
        return res.status(403).json({ error: "Accès refusé. Vous n'avez pas les droits nécessaires." })
      }
  } catch (e) {
    return res.status(401).json({ error: 'Session invalide. Veuillez vous reconnecter.' })
  }
  return res.status(200).json({ success: true })
}

export default handler
