import { authAdmin, dbAdmin } from '@/lib/firebase-admin/admin_config'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'
import { logAuditEvent } from '@/lib/firebase-admin/auditLog'
import { hasManagerAction } from '@/lib/constants/managerModules'

export default async function desableUser(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' })
  }

  const caller = await verifyAdminRequest(req)
  if (!caller) {
    return res.status(403).json({ error: 'Accès refusé.' })
  }

  const { desableAccount, id } = req.body || {}
  if (typeof id !== 'string' || !id || typeof desableAccount !== 'boolean') {
    return res.status(400).json({ error: 'Identifiant et statut de compte invalides.' })
  }
  if (id === caller.uid) {
    return res.status(400).json({ error: 'Vous ne pouvez pas modifier votre propre accès.' })
  }

  try {
    const target = await authAdmin.getUser(id)
    const targetRole = target.customClaims?.userType || target.customClaims?.role

    if (caller.userType !== 'admin') {
      const module = targetRole === 'agent' ? 'agents' : targetRole === 'worker' ? 'workers' : null
      if (!module || !hasManagerAction(caller.permissions, module, 'process')) {
        return res.status(403).json({ error: 'Accès refusé.' })
      }
    }

    const userRef = dbAdmin.collection('users').doc(id)
    const userSnap = await userRef.get()
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' })
    }

    await authAdmin.updateUser(id, { disabled: desableAccount })
    await userRef.update({ isAvailable: !desableAccount })
    await logAuditEvent({
      action: desableAccount ? 'user.disable' : 'user.enable',
      actorUid: caller.uid,
      actorEmail: caller.email,
      actorType: caller.userType,
      targetUid: id,
    })
    return res.status(200).json({ message: 'Utilisateur désactivé avec succès' })
  } catch (error) {
    console.error('Erreur de modification du compte utilisateur:', error)
    return res.status(500).json({ error: 'Impossible de modifier le compte utilisateur.' })
  }
}
