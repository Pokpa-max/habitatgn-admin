import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const leadsCollectionRef = collection(db, 'leads')

export const getLeads = async () => {
  const q = query(leadsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const updateLeadStatus = async (id, status) => {
  await updateDoc(doc(db, 'leads', id), { status })
}

export const setLeadRead = async (id, read) => {
  await updateDoc(doc(db, 'leads', id), { read })
}

export const deleteLead = async (id) => {
  await deleteDoc(doc(db, 'leads', id))
}
