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

export const managedPropertiesCollectionRef = collection(db, 'managed_properties')

export const managedPropertyDocRef = (id) => doc(db, 'managed_properties', id)

export const getManagedProperties = async () => {
  const q = query(managedPropertiesCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getPropertiesByOwner = async (ownerId) => {
  const q = query(managedPropertiesCollectionRef, where('ownerId', '==', ownerId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addManagedProperty = async (data) => {
  const payload = { ...data, createdAt: new Date() }
  const docRef = await addDoc(managedPropertiesCollectionRef, payload)
  return { id: docRef.id, ...payload }
}

export const editManagedProperty = async (id, data) => {
  await updateDoc(managedPropertyDocRef(id), data)
}

export const deleteManagedProperty = async (id) => {
  await deleteDoc(managedPropertyDocRef(id))
}
