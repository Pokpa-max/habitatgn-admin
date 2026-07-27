import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const productsCollectionRef = collection(db, 'products')
export const productDocRef = (id) => doc(db, 'products', id)

export const getProducts = async () => {
  const q = query(productsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addProduct = async (data) => {
  const payload = {
    title: data.title,
    category: data.category || '',
    commune: data.commune || '',
    price: Number(data.price || 0),
    description: data.description || '',
    imageUrls: data.imageUrls || [],
    phone: data.phone || '',
    userId: data.userId || '',
    active: data.active !== undefined ? Boolean(data.active) : true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const docRef = await addDoc(productsCollectionRef, payload)
  return { id: docRef.id, ...payload }
}

export const updateProduct = async (id, data) => {
  const payload = {
    title: data.title,
    category: data.category || '',
    commune: data.commune || '',
    price: Number(data.price || 0),
    description: data.description || '',
    imageUrls: data.imageUrls || [],
    phone: data.phone || '',
    active: Boolean(data.active),
    updatedAt: serverTimestamp(),
  }
  await updateDoc(productDocRef(id), payload)
}

export const toggleProductActive = async (id, active) => {
  await updateDoc(productDocRef(id), { active, updatedAt: serverTimestamp() })
}

export const deleteProduct = async (id) => {
  await deleteDoc(productDocRef(id))
}
