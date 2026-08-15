import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { fetchWithPost } from '@/utils/fetch'

export const workersCollectionRef = collection(db, 'workers')

export const workerDocRef = (id) => doc(db, 'workers', id)

export const getWorkers = async () => {
  const q = query(workersCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getWorkerById = async (id) => {
  const snap = await getDoc(workerDocRef(id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const approveWorker = async (id, userId) => {
  // approvedAt sert de point de départ à la période d'essai de 3 mois avant abonnement payant
  await updateDoc(workerDocRef(id), { status: 'approved', approvedAt: serverTimestamp() })
  if (userId) {
    await setDoc(doc(db, 'users', userId), { role: 'worker', type: 'worker' }, { merge: true })
    try {
      await fetchWithPost('/api/setCustomClaims', {
        uid: userId,
        role: 'worker',
        userType: 'worker',
      })
    } catch (err) {
      console.error('Erreur lors de la mise à jour des custom claims:', err)
    }
  }
}

export const rejectWorker = async (id) => {
  await updateDoc(workerDocRef(id), { status: 'rejected' })
}

// Le site public n'affiche un ouvrier que si son statut est "approved" — rien
// d'autre n'est vérifié (pas de champ isAvailable côté profil ouvrier). Bloquer
// le compte doit donc aussi changer ce statut, sinon le profil reste visible et
// contactable alors que le compte est désactivé.
export const hideWorkerFromPublic = async (id) => {
  const snap = await getDoc(workerDocRef(id))
  if (!snap.exists()) return
  const current = snap.data()
  if (current.status !== 'approved') return
  await updateDoc(workerDocRef(id), {
    status: 'rejected',
    suspendedByAdmin: true,
    statusBeforeSuspension: 'approved',
  })
}

// Contrepartie : ne restaure que si c'est nous qui avions masqué le profil,
// pour ne jamais republier un profil qu'un admin aurait rejeté pour une autre
// raison entre-temps.
export const restoreWorkerVisibility = async (id) => {
  const snap = await getDoc(workerDocRef(id))
  if (!snap.exists()) return
  const current = snap.data()
  if (!current.suspendedByAdmin) return
  await updateDoc(workerDocRef(id), {
    status: current.statusBeforeSuspension || 'approved',
    suspendedByAdmin: false,
  })
}
