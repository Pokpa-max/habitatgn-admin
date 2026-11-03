import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin } from '@/lib/firebase-admin/admin_config'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'
import { logAuditEvent } from '@/lib/firebase-admin/auditLog'

// Réinitialisation directe du mot de passe d'un manager par un admin — action
// plus sensible que le reste (créer un compte, activer/désactiver...), donc
// contrôle strict "admin" ici plutôt que le verifyAdminRequest habituel qui
// laisse aussi passer les managers.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 0, message: 'Méthode non autorisée.' })
  }

  const caller = await verifyAdminRequest(req)
  if (!caller || caller.userType !== 'admin') {
    return res.status(403).json({ code: 0, message: 'Accès refusé.' })
  }

  const { uid, newPassword } = req.body || {}

  if (typeof uid !== 'string' || !uid || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({
      code: 0,
      message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
    })
  }

  try {
    if (uid === caller.uid) {
      return res.status(400).json({ code: 0, message: 'Utilisez le changement de mot de passe de votre compte.' })
    }

    const target = await authAdmin.getUser(uid)
    const targetRole = target.customClaims?.userType || target.customClaims?.role
    if (!['manager', 'agent', 'worker'].includes(targetRole)) {
      return res.status(403).json({ code: 0, message: 'Réinitialisation réservée aux comptes manager, agent et artisan.' })
    }

    await authAdmin.updateUser(uid, { password: newPassword })
    await authAdmin.revokeRefreshTokens(uid)
    await logAuditEvent({
      action: 'user.password_reset',
      actorUid: caller.uid,
      actorEmail: caller.email,
      actorType: caller.userType,
      targetUid: uid,
    })
    res.status(200).json({ code: 1, message: 'Mot de passe réinitialisé.' })
  } catch (error: any) {
    console.error('Error resetting password:', error)
    res.status(500).json({ code: 0, message: error.message || 'Une erreur est survenue' })
  }
}
