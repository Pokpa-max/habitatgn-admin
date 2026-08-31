import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin, dbAdmin } from '@/lib/firebase-admin/admin_config'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const caller = await verifyAdminRequest(req)
  if (!caller) {
    return res.status(403).json({ message: 'Accès refusé.' })
  }

  try {
    const { uid, role, userType } = req.body

    if (!uid) {
      return res.status(400).json({ message: 'UID requis' })
    }

    const assignedRole = role || userType || 'agent'
    const assignedUserType = userType || role || 'agent'

    // 1. Definit les custom claims Firebase Auth
    await authAdmin.setCustomUserClaims(uid, {
      userType: assignedUserType,
      role: assignedRole,
    })

    // 2. Met a jour le document utilisateur Firestore
    await dbAdmin.collection('users').doc(uid).set(
      {
        role: assignedRole,
        type: assignedUserType,
      },
      { merge: true }
    )

    return res.status(200).json({
      code: 1,
      message: 'Claims et rôle mis à jour avec succès',
      uid,
    })
  } catch (error: any) {
    console.error('Error setting custom claims:', error)
    return res.status(500).json({
      code: 0,
      message: error.message || 'Erreur lors de la mise à jour des claims',
    })
  }
}
