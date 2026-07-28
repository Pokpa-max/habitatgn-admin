import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const rentPaymentsCollectionRef = collection(db, 'rent_payments')

export const rentPaymentDocRef = (id) => doc(db, 'rent_payments', id)

export const getRentPayments = async () => {
  const q = query(rentPaymentsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getPaymentsByProperty = async (propertyId) => {
  const q = query(rentPaymentsCollectionRef, where('propertyId', '==', propertyId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getPaymentsByLease = async (leaseId) => {
  const q = query(rentPaymentsCollectionRef, where('leaseId', '==', leaseId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addRentPayment = async (data) => {
  const payload = { ...data, createdAt: new Date() }
  const docRef = await addDoc(rentPaymentsCollectionRef, payload)
  return { id: docRef.id, ...payload }
}

export const deleteRentPayment = async (id) => {
  await deleteDoc(rentPaymentDocRef(id))
}
