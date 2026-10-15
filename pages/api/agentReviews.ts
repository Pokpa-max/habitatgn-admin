import type { NextApiRequest, NextApiResponse } from 'next'
import { FieldValue } from 'firebase-admin/firestore'
import { dbAdmin } from '@/lib/firebase-admin/admin_config'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'

/**
 * Modération des avis vérifiés sur les agents (laissés sur le site public,
 * voir habitatgnweb/src/app/api/agent-reviews). Ces collections ne sont
 * accessibles qu'avec le SDK admin, d'où cette route.
 *
 * GET    ?agentId=<uid>          -> liste des avis
 * DELETE { agentId, reviewId }   -> suppression + note moyenne recalculée
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const caller = await verifyAdminRequest(req)
  if (!caller) return res.status(403).json({ message: 'Accès refusé.' })

  try {
    if (req.method === 'GET') {
      const agentId = String(req.query.agentId || '')
      if (!agentId) return res.status(400).json({ message: 'agentId requis' })
      const snapshot = await dbAdmin.collection('agent_reviews').where('agentId', '==', agentId).get()
      const reviews = snapshot.docs
        .map((doc) => {
          const r = doc.data()
          return {
            id: doc.id,
            author: r.author || 'Client',
            rating: Number(r.rating) || 0,
            comment: r.comment || '',
            listingTitle: r.listingTitle || '',
            createdAt: r.createdAt?.toMillis?.() ?? 0,
          }
        })
        .sort((a, b) => b.createdAt - a.createdAt)
      return res.status(200).json({ reviews })
    }

    if (req.method === 'DELETE') {
      const { agentId, reviewId } = req.body || {}
      if (!agentId || !reviewId) return res.status(400).json({ message: 'agentId et reviewId requis' })

      const ref = dbAdmin.collection('agent_reviews').doc(String(reviewId))
      const snap = await ref.get()
      if (!snap.exists || snap.data()?.agentId !== agentId) {
        return res.status(404).json({ message: 'Avis introuvable' })
      }
      await ref.delete()

      // Note moyenne recalculée sur les avis restants
      const remaining = await dbAdmin.collection('agent_reviews').where('agentId', '==', agentId).get()
      const count = remaining.size
      const average = count
        ? remaining.docs.reduce((sum, d) => sum + (Number(d.data().rating) || 0), 0) / count
        : 0
      await dbAdmin
        .collection('agent_ratings')
        .doc(String(agentId))
        .set({ rating: Math.round(average * 10) / 10, count, updatedAt: FieldValue.serverTimestamp() }, { merge: true })

      return res.status(200).json({ count })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Erreur modération avis agent:', error)
    return res.status(500).json({ message: 'Erreur interne' })
  }
}
