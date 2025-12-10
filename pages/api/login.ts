import { setAuthCookies } from 'next-firebase-auth'
import initAuth from 'utils/firebase/initAuth'
import { authAdmin } from '../../lib/firebase-admin/admin_config'

initAuth()

const handler = async (req, res) => {
  try {
    const token = req.headers.authorization

    const decodedToken = await authAdmin.verifyIdToken(token)
    const isAdmin =
      decodedToken.userType === 'admin' || decodedToken.userType === 'manager'

    if (isAdmin) {
      await setAuthCookies(req, res)
    } else {
      return res.status(500).json({ error: "Votre compte n'est pas valide" })
    }
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected error.' })
  }
  return res.status(200).json({ success: true })
}

export default handler
