import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin, dbAdmin } from '@/lib/firebase-admin/admin_config'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'
import { hasManagerAction } from '@/lib/constants/managerModules'

/**
 * Attribue le rôle agent / artisan à un compte, à la validation de sa
 * candidature (voir approveAgentRequest / approveWorker).
 *
 * Sécurité : seuls les rôles « agent » et « worker » peuvent être donnés ici
 * (les comptes admin / manager se créent via /api/createUser, qui contrôle
 * les droits) ; un manager doit pouvoir traiter le module concerné ; un
 * compte de l'équipe n'est jamais modifié par cette route.
 */
const ROLE_MODULE: Record<string, string> = { agent: 'agents', worker: 'workers' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const caller = await verifyAdminRequest(req)
  if (!caller) {
    return res.status(403).json({ message: 'Accès refusé.' })
  }

  try {
    const { uid, role, userType } = req.body || {}
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ message: 'UID requis' })
    }

    const assignedRole = role || userType || 'agent'
    if (!ROLE_MODULE[assignedRole] || (userType && userType !== assignedRole)) {
      return res.status(400).json({ message: 'Rôle non autorisé.' })
    }

    if (caller.userType === 'manager') {
      const callerSnap = await dbAdmin.collection('users').doc(caller.uid).get()
      if (!hasManagerAction(callerSnap.data()?.permissions, ROLE_MODULE[assignedRole], 'process')) {
        return res.status(403).json({ message: 'Vous ne pouvez pas valider ce type de compte.' })
      }
    }

    // Jamais un compte de l'équipe (ni rétrogradation d'un admin / manager)
    const target = await authAdmin.getUser(uid)
    const targetRole = target.customClaims?.userType || target.customClaims?.role
    if (targetRole === 'admin' || targetRole === 'manager') {
      return res.status(403).json({ message: "Ce compte appartient à l'équipe." })
    }

    await authAdmin.setCustomUserClaims(uid, { userType: assignedRole, role: assignedRole })
    await dbAdmin.collection('users').doc(uid).set({ role: assignedRole, type: assignedRole }, { merge: true })

    return res.status(200).json({ code: 1, message: 'Rôle mis à jour', uid })
  } catch (error: any) {
    console.error('Error setting custom claims:', error)
    return res.status(500).json({ code: 0, message: 'Erreur lors de la mise à jour du rôle' })
  }
}
