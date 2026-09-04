import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin } from '@/lib/firebase-admin/admin_config'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'

// Réinitialisation directe du mot de passe d'un manager par un admin — action
// plus sensible que le reste (créer un compte, activer/désactiver...), donc
// contrôle strict "admin" ici plutôt que le verifyAdminRequest habituel qui
// laisse aussi passer les managers.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const caller = await verifyAdminRequest(req)
  if (!caller || caller.userType !== 'admin') {
    return res.status(403).json({ code: 0, message: 'Accès refusé.' })
  }

  const { uid, newPassword } = req.body

  if (!uid || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({
      code: 0,
      message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
    })
  }

  try {
    await authAdmin.updateUser(uid, { password: newPassword })
    res.status(200).json({ code: 1, message: 'Mot de passe réinitialisé.' })
  } catch (error: any) {
    console.error('Error resetting password:', error)
    res.status(500).json({ code: 0, message: error.message || 'Une erreur est survenue' })
  }
}
