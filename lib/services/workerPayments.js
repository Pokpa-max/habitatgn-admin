import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { notifySiteUser } from '@/lib/services/accountNotifications'
import { syncWorkerPro } from '@/lib/services/proPlan'

// Un ouvrier approuvé bénéficie d'une période d'essai gratuite, puis doit régler
// un abonnement mensuel à montant fixe pour rester référencé.
export const TRIAL_MONTHS = 3
const BILLING_CYCLE_MONTHS = 1

const workerPaymentsCollectionRef = collection(db, 'worker_payments')

const subscriptionConfigDocRef = doc(db, 'subscription_settings', 'worker')
const legacySubscriptionConfigDocRef = doc(db, 'appConfig', 'worker_subscription')

const getSubscriptionConfigSnap = async () => {
  const snap = await getDoc(subscriptionConfigDocRef)
  if (snap.exists()) return snap
  const legacySnap = await getDoc(legacySubscriptionConfigDocRef)
  if (legacySnap.exists()) {
    await setDoc(subscriptionConfigDocRef, legacySnap.data(), { merge: true })
    return legacySnap
  }
  return snap
}

export const getWorkerSubscriptionAmount = async () => {
  const snap = await getSubscriptionConfigSnap()
  return snap.exists() ? Number(snap.data().monthlyAmount) || 0 : 0
}

export const setWorkerSubscriptionAmount = async (monthlyAmount) => {
  await setDoc(
    subscriptionConfigDocRef,
    { monthlyAmount: Number(monthlyAmount) || 0, updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export const getWorkerSubscriptionDescription = async () => {
  const snap = await getSubscriptionConfigSnap()
  return snap.exists() ? snap.data().description || '' : ''
}

export const setWorkerSubscriptionDescription = async (description) => {
  await setDoc(
    subscriptionConfigDocRef,
    { description: description || '', updatedAt: serverTimestamp() },
    { merge: true }
  )
}

export const getAllWorkerPayments = async () => {
  const snapshot = await getDocs(workerPaymentsCollectionRef)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getWorkerPayments = async (workerId) => {
  const q = query(workerPaymentsCollectionRef, where('workerId', '==', workerId))
  const snapshot = await getDocs(q)
  const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  return rows.sort((a, b) => toDate(b.paidAt) - toDate(a.paidAt))
}

export const recordWorkerPayment = async (
  workerId,
  amount,
  paidAt = new Date(),
  monthsCovered = BILLING_CYCLE_MONTHS
) => {
  const ref = await addDoc(workerPaymentsCollectionRef, {
    workerId,
    amount: Number(amount) || 0,
    monthsCovered: Number(monthsCovered) || 1,
    paidAt,
    createdAt: serverTimestamp(),
  })
  // Badge Pro prolongé jusqu'à la fin de la période payée (site : badge + en tête)
  await syncWorkerPro(workerId)
  // L'ouvrier reçoit la confirmation du paiement
  await notifySiteUser('payment', { kind: 'worker', id: ref.id })
}

const toDate = (value) => {
  if (!value) return null
  if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate()
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

const addMonths = (date, months) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

// Calcule le statut d'abonnement d'un ouvrier à partir de sa date d'approbation
// et de l'historique de ses paiements (déjà triés ou non).
//
// Modèle « gratuit + Pro » : chaque paiement couvre ses `monthsCovered` à partir
// de la date la plus tardive entre la fin de la couverture précédente (ou de
// l'essai) et la date du paiement. Un paiement d'avance prolonge donc la suite ;
// un paiement après une période gratuite démarre le jour du paiement (et non
// dans le passé). Même règle côté site : habitatgnweb/src/lib/subscriptionStatus.ts.
export const computeWorkerPaymentStatus = (worker, payments = []) => {
  const approvedAt = toDate(worker?.approvedAt) || toDate(worker?.createdAt)
  if ((worker?.status || 'pending') !== 'approved' || !approvedAt) {
    return { status: 'unknown', trialEndAt: null, nextDueAt: null, lastPayment: null, totalMonthsPaid: 0 }
  }

  const trialEndAt = addMonths(approvedAt, TRIAL_MONTHS)
  const now = new Date()

  const sorted = [...payments].sort((a, b) => toDate(b.paidAt) - toDate(a.paidAt))
  const lastPayment = sorted[0] || null
  const totalMonthsPaid = payments.reduce(
    (sum, p) => sum + (Number(p.monthsCovered) || BILLING_CYCLE_MONTHS),
    0
  )
  // Couverture : paiements dans l'ordre chronologique, chacun démarre à
  // max(fin de couverture précédente, date du paiement)
  let coveredUntil = trialEndAt
  for (const payment of [...payments].sort((a, b) => toDate(a.paidAt) - toDate(b.paidAt))) {
    const paidAt = toDate(payment.paidAt) || trialEndAt
    const start = paidAt > coveredUntil ? paidAt : coveredUntil
    coveredUntil = addMonths(start, Number(payment.monthsCovered) || BILLING_CYCLE_MONTHS)
  }

  if (now < trialEndAt) {
    // Payé pendant l'essai : la couverture va au-delà de la fin d'essai
    return { status: 'trial', trialEndAt, nextDueAt: coveredUntil, lastPayment, totalMonthsPaid }
  }

  return {
    status: now <= coveredUntil ? 'active' : 'overdue',
    trialEndAt,
    nextDueAt: coveredUntil,
    lastPayment,
    totalMonthsPaid,
  }
}
