import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const contactMessagesCollectionRef = collection(db, 'contacts')

export const getContactMessages = async () => {
  const q = query(contactMessagesCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const setContactMessageRead = async (id, read) => {
  await updateDoc(doc(db, 'contacts', id), { read })
}

export const deleteContactMessage = async (id) => {
  await deleteDoc(doc(db, 'contacts', id))
}
