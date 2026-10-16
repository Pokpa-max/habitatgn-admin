import type { NextApiRequest, NextApiResponse } from 'next'
import { FieldValue } from 'firebase-admin/firestore'
import { authAdmin, dbAdmin } from 'lib/firebase-admin/admin_config'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'
import { logAuditEvent } from '@/lib/firebase-admin/auditLog'

/**
 * Suppression définitive d'un compte agent (admin uniquement).
 *
 * Supprime : la candidature (agent_requests), le compte de connexion, le
 * profil (users), ses annonces (maisons, terrains, locations à la nuitée) et
 * les demandes de visite reçues sur ces annonces. L'agence partenaire
 * éventuelle est seulement détachée. Les paiements sont conservés
 * (historique comptable).
 */
const LISTING_COLLECTIONS = ['houses', 'lands', 'daily_rentals']

const deleteQuery = async (query: FirebaseFirestore.Query) => {
  const snapshot = await query.get()
  for (let i = 0; i < snapshot.docs.length; i += 400) {
    const batch = dbAdmin.batch()
    snapshot.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }
  return snapshot.size
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Méthode non autorisée.' })

  const caller = await verifyAdminRequest(req)
  if (!caller || caller.userType !== 'admin') {
    return res.status(403).json({ message: 'Seul un administrateur peut supprimer un compte.' })
  }

  const { agentRequestId } = req.body || {}
  if (!agentRequestId || typeof agentRequestId !== 'string') {
    return res.status(400).json({ message: 'Candidature introuvable.' })
  }

  try {
    const requestRef = dbAdmin.collection('agent_requests').doc(agentRequestId)
    const requestSnap = await requestRef.get()
    if (!requestSnap.exists) return res.status(404).json({ message: 'Candidature introuvable.' })
    const agent = requestSnap.data() || {}
    const uid: string | null = typeof agent.userId === 'string' && agent.userId ? agent.userId : null

    let listings = 0
    let leads = 0

    if (uid) {
      // Jamais un compte de l'équipe (admin / manager)
      const userSnap = await dbAdmin.collection('users').doc(uid).get()
      const role = userSnap.data()?.role || userSnap.data()?.type
      if (role === 'admin' || role === 'manager') {
        return res.status(400).json({ message: "Ce compte appartient à l'équipe : suppression refusée." })
      }

      for (const name of LISTING_COLLECTIONS) {
        listings += await deleteQuery(dbAdmin.collection(name).where('ownerId', '==', uid))
      }
      leads = await deleteQuery(dbAdmin.collection('leads').where('ownerId', '==', uid))

      const agencies = await dbAdmin.collection('partner_agencies').where('ownerId', '==', uid).get()
      await Promise.all(agencies.docs.map((d) => d.ref.update({ ownerId: FieldValue.delete() })))

      // Autres candidatures éventuelles du même compte
      await deleteQuery(dbAdmin.collection('agent_requests').where('userId', '==', uid))
      await dbAdmin.collection('users').doc(uid).delete()
      await authAdmin.deleteUser(uid).catch((error: any) => {
        if (error?.code !== 'auth/user-not-found') throw error
      })
    }

    await requestRef.delete().catch(() => {})

    await logAuditEvent({
      action: 'agent_deleted',
      actorUid: caller.uid,
      actorEmail: caller.email || null,
      actorType: caller.userType,
      targetUid: uid,
      targetEmail: agent.email || null,
      details: { agentRequestId, name: agent.fullName || null, listings, leads },
    })

    return res.status(200).json({ ok: true, listings, leads })
  } catch (error) {
    console.error('Suppression agent :', error)
    return res.status(500).json({ message: 'La suppression a échoué. Réessayez.' })
  }
}
