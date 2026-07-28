import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const getPackages = async (collectionName) => {
  const colRef = collection(db, collectionName)
  const snapshot = await getDocs(colRef)
  return snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.priceGNF || 0) - (b.priceGNF || 0))
}

export const savePackage = async (collectionName, pkg) => {
  const colRef = collection(db, collectionName)
  const docRef = pkg.id ? doc(colRef, pkg.id) : doc(colRef)
  const data = { ...pkg, id: docRef.id }
  await setDoc(docRef, data)
  return data
}

export const deletePackage = async (collectionName, id) => {
  await deleteDoc(doc(db, collectionName, id))
}
