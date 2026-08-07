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

// Un ouvrier approuvé bénéficie d'une période d'essai gratuite, puis doit régler
// un abonnement mensuel à montant fixe pour rester référencé.
export const TRIAL_MONTHS = 3
export const BILLING_CYCLE_MONTHS = 1

export const workerPaymentsCollectionRef = collection(db, 'worker_payments')

const subscriptionConfigDocRef = doc(db, 'appConfig', 'worker_subscription')

export const getWorkerSubscriptionAmount = async () => {
  const snap = await getDoc(subscriptionConfigDocRef)
  return snap.exists() ? Number(snap.data().monthlyAmount) || 0 : 0
}

export const setWorkerSubscriptionAmount = async (monthlyAmount) => {
  await setDoc(
    subscriptionConfigDocRef,
    { monthlyAmount: Number(monthlyAmount) || 0, updatedAt: serverTimestamp() },
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
  await addDoc(workerPaymentsCollectionRef, {
    workerId,
    amount: Number(amount) || 0,
    monthsCovered: Number(monthsCovered) || 1,
    paidAt,
    createdAt: serverTimestamp(),
  })
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
// La couverture s'accumule : chaque paiement ajoute son `monthsCovered` à la date
// de fin d'essai, quel que soit l'ordre d'enregistrement. Un ouvrier qui paie
// plusieurs mois d'avance (ou qui rattrape un retard en une fois) voit donc son
// échéance avancer d'autant de mois, plutôt que d'un seul cycle fixe.
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
  const coveredUntil = addMonths(trialEndAt, totalMonthsPaid)

  if (now < trialEndAt) {
    return { status: 'trial', trialEndAt, nextDueAt: trialEndAt, lastPayment, totalMonthsPaid }
  }

  return {
    status: now <= coveredUntil ? 'active' : 'overdue',
    trialEndAt,
    nextDueAt: coveredUntil,
    lastPayment,
    totalMonthsPaid,
  }
}
