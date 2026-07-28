import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const partnerAgenciesCollectionRef = collection(db, 'partner_agencies')

export const partnerAgencyDocRef = (id) => doc(db, 'partner_agencies', id)

export const getPartnerAgencies = async () => {
  const snapshot = await getDocs(partnerAgenciesCollectionRef)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const slugify = (name) =>
  (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

export const addPartnerAgency = async (data) => {
  const docRef = await addDoc(partnerAgenciesCollectionRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
  return { id: docRef.id, ...data }
}

export const editPartnerAgency = async (id, data) => {
  await updateDoc(partnerAgencyDocRef(id), data)
}

export const deletePartnerAgency = async (id) => {
  await deleteDoc(partnerAgencyDocRef(id))
}

export const togglePartnerAgencyActive = async (id, active) => {
  await updateDoc(partnerAgencyDocRef(id), { active })
}
