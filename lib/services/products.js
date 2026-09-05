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
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { deleteFromCloudinary } from '@/utils/cloudinary'

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

export const setProductBoost = async (id, boostedUntil) => {
  await updateDoc(productDocRef(id), { boostedUntil, updatedAt: serverTimestamp() })
}

export const deleteProduct = async (id) => {
  const targetRef = productDocRef(id)
  const snap = await getDoc(targetRef).catch(() => null)
  if (snap?.exists()) {
    const urls = Array.isArray(snap.data().imageUrls) ? snap.data().imageUrls.filter(Boolean) : []
    await Promise.all(urls.map((url) => deleteFromCloudinary(url)))
  }
  await deleteDoc(targetRef)
}
