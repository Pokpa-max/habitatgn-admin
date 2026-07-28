import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const leasesCollectionRef = collection(db, 'leases')

export const leaseDocRef = (id) => doc(db, 'leases', id)

export const getLeases = async () => {
  const q = query(leasesCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getLeasesByProperty = async (propertyId) => {
  const q = query(leasesCollectionRef, where('propertyId', '==', propertyId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addLease = async (data) => {
  const payload = { ...data, createdAt: new Date() }
  const docRef = await addDoc(leasesCollectionRef, payload)
  return { id: docRef.id, ...payload }
}

export const editLease = async (id, data) => {
  await updateDoc(leaseDocRef(id), data)
}

export const deleteLease = async (id) => {
  await deleteDoc(leaseDocRef(id))
}
