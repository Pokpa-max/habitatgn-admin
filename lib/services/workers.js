import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
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
  await updateDoc(workerDocRef(id), { status: 'approved' })
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
