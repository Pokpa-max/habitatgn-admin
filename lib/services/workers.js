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
    await setDoc(doc(db, 'users', userId), { role: 'worker' }, { merge: true })
  }
}

export const rejectWorker = async (id) => {
  await updateDoc(workerDocRef(id), { status: 'rejected' })
}
