import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { computeWorkerPaymentStatus, getWorkerPayments } from '@/lib/services/workerPayments'
import { computeAgentPaymentStatus, getAgentPayments } from '@/lib/services/agentPayments'

/**
 * Formule Pro pilotée par les paiements (modèle « gratuit + Pro », paiement
 * manuel enregistré dans l'admin).
 *
 * Le site affiche le badge « Pro » et le classement en tête d'après les champs
 * `plan` / `planExpiresAt` (ouvrier, agence partenaire). Ces fonctions les
 * alignent sur la couverture payée (période offerte + paiements) :
 * - couverture en cours → plan « pro » jusqu'à la fin de la couverture ;
 * - on ne fait que PROLONGER : une date réglée à la main plus lointaine
 *   (geste commercial) est conservée, et un plan « premium » le reste.
 * Aucune notification envoyée ici (le paiement / la validation en envoient déjà).
 */

const toDate = (value) => {
  if (!value) return null
  if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate()
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/** Champs à écrire pour couvrir jusqu'à `coveredUntil`, ou null si rien à changer. */
const proUpdate = (current, coveredUntil) => {
  if (!coveredUntil || coveredUntil <= new Date()) return null
  const currentEnd = toDate(current.planExpiresAt)
  const hasPlan = current.plan === 'pro' || current.plan === 'premium'
  // Déjà couvert aussi loin (ou plan sans date de fin) : on ne touche à rien
  if (hasPlan && (!current.planExpiresAt || (currentEnd && currentEnd >= coveredUntil))) return null
  return {
    plan: current.plan === 'premium' ? 'premium' : 'pro',
    planExpiresAt: coveredUntil,
  }
}

/** Ouvrier : badge Pro aligné sur sa couverture. Renvoie true si modifié. */
export const syncWorkerPro = async (workerId) => {
  const snap = await getDoc(doc(db, 'workers', workerId))
  if (!snap.exists()) return false
  const worker = { id: snap.id, ...snap.data() }
  const status = computeWorkerPaymentStatus(worker, await getWorkerPayments(workerId))
  if (status.status !== 'trial' && status.status !== 'active') return false
  const update = proUpdate(worker, status.nextDueAt)
  if (!update) return false
  await updateDoc(snap.ref, update)
  return true
}

/**
 * Agent : le Pro s'affiche sur son agence partenaire (page Agences du site),
 * si une agence est rattachée à son compte (champ « ownerId »).
 * Renvoie le nombre d'agences modifiées.
 */
export const syncAgentPro = async (agentRequestId) => {
  const snap = await getDoc(doc(db, 'agent_requests', agentRequestId))
  if (!snap.exists()) return 0
  const agent = { id: snap.id, ...snap.data() }
  if (!agent.userId) return 0
  const status = computeAgentPaymentStatus(agent, await getAgentPayments(agentRequestId))
  if (status.status !== 'trial' && status.status !== 'active') return 0
  const agencies = await getDocs(query(collection(db, 'partner_agencies'), where('ownerId', '==', agent.userId)))
  let changed = 0
  for (const agency of agencies.docs) {
    const update = proUpdate(agency.data(), status.nextDueAt)
    if (update) {
      await updateDoc(agency.ref, update)
      changed++
    }
  }
  return changed
}

/** Rattrapage : aligne tous les ouvriers et agents validés. */
export const syncAllPro = async () => {
  const [workers, agents] = await Promise.all([
    getDocs(query(collection(db, 'workers'), where('status', '==', 'approved'))),
    getDocs(query(collection(db, 'agent_requests'), where('status', '==', 'approved'))),
  ])
  let updated = 0
  for (const w of workers.docs) if (await syncWorkerPro(w.id)) updated++
  for (const a of agents.docs) updated += await syncAgentPro(a.id)
  return updated
}
