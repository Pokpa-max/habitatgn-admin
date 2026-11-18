import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin, dbAdmin } from 'lib/firebase-admin/admin_config'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'
import { logAuditEvent } from '@/lib/firebase-admin/auditLog'

/**
 * Suppression définitive d'un ouvrier AVEC compte (admin uniquement).
 *
 * Supprime : la fiche ouvrier (workers), le profil (users) et le compte de
 * connexion. Les paiements (worker_payments) sont conservés (historique
 * comptable). Si le compte sert aussi à autre chose (agent), seule la fiche
 * ouvrier est retirée et le compte est gardé. Un compte de l'équipe
 * (admin / manager) n'est jamais supprimé.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Méthode non autorisée.' })

  const caller = await verifyAdminRequest(req)
  if (!caller || caller.userType !== 'admin') {
    return res.status(403).json({ message: 'Seul un administrateur peut supprimer un compte.' })
  }

  const { workerId } = req.body || {}
  if (!workerId || typeof workerId !== 'string') {
    return res.status(400).json({ message: 'Ouvrier introuvable.' })
  }

  try {
    const workerRef = dbAdmin.collection('workers').doc(workerId)
    const workerSnap = await workerRef.get()
    if (!workerSnap.exists) return res.status(404).json({ message: 'Ouvrier introuvable.' })
    const worker = workerSnap.data() || {}
    const uid: string | null = typeof worker.userId === 'string' && worker.userId ? worker.userId : null

    let accountDeleted = false

    if (uid) {
      const userSnap = await dbAdmin.collection('users').doc(uid).get()
      const role = userSnap.data()?.role || userSnap.data()?.type
      if (role === 'admin' || role === 'manager') {
        return res.status(400).json({ message: "Ce compte appartient à l'équipe : suppression refusée." })
      }

      // Autres fiches ouvrier éventuelles du même compte
      const others = await dbAdmin.collection('workers').where('userId', '==', uid).get()
      const batch = dbAdmin.batch()
      others.docs.forEach((d) => batch.delete(d.ref))
      batch.delete(workerRef)
      await batch.commit()

      // Compte utilisé comme agent : on ne retire que la fiche ouvrier
      if (!role || role === 'worker' || role === 'user') {
        await dbAdmin.collection('users').doc(uid).delete()
        await authAdmin.deleteUser(uid).catch((error: any) => {
          if (error?.code !== 'auth/user-not-found') throw error
        })
        accountDeleted = true
      }
    } else {
      await workerRef.delete()
    }

    await logAuditEvent({
      action: 'worker_deleted',
      actorUid: caller.uid,
      actorEmail: caller.email || null,
      actorType: caller.userType,
      targetUid: uid,
      targetEmail: worker.email || null,
      details: { workerId, name: worker.name || null, accountDeleted },
    })

    return res.status(200).json({ ok: true, accountDeleted })
  } catch (error) {
    console.error('Suppression ouvrier :', error)
    return res.status(500).json({ message: 'La suppression a échoué. Réessayez.' })
  }
}
