import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { notifySiteUser } from '@/lib/services/accountNotifications'

export const leadsCollectionRef = collection(db, 'leads')

export const getLeads = async () => {
  const q = query(leadsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const updateLeadStatus = async (id, status) => {
  await updateDoc(doc(db, 'leads', id), { status })
  // Le client (s'il était connecté à l'envoi) est prévenu : prise en charge / clôture
  await notifySiteUser('lead_status', { id })
}

export const deleteLead = async (id) => {
  await deleteDoc(doc(db, 'leads', id))
}
