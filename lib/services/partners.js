import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const partnersCollectionRef = collection(db, 'legalPartners')

export const partnerDocRef = (id) => doc(db, 'legalPartners', id)

export const getPartners = async () => {
  const snapshot = await getDocs(partnersCollectionRef)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addPartner = async (data) => {
  const docRef = await addDoc(partnersCollectionRef, data)
  return { id: docRef.id, ...data }
}

export const editPartner = async (id, data) => {
  await updateDoc(partnerDocRef(id), data)
}

export const deletePartner = async (id) => {
  await deleteDoc(partnerDocRef(id))
}

export const togglePartnerAvailable = async (id, available) => {
  await updateDoc(partnerDocRef(id), { available })
}
