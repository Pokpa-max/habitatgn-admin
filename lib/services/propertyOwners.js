import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const propertyOwnersCollectionRef = collection(db, 'property_owners')

export const propertyOwnerDocRef = (id) => doc(db, 'property_owners', id)

export const getPropertyOwners = async () => {
  const q = query(propertyOwnersCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getPropertyOwnerById = async (id) => {
  const snap = await getDoc(propertyOwnerDocRef(id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const addPropertyOwner = async (data) => {
  const payload = { ...data, createdAt: new Date() }
  const docRef = await addDoc(propertyOwnersCollectionRef, payload)
  return { id: docRef.id, ...payload }
}

export const editPropertyOwner = async (id, data) => {
  await updateDoc(propertyOwnerDocRef(id), data)
}

export const deletePropertyOwner = async (id) => {
  await deleteDoc(propertyOwnerDocRef(id))
}
