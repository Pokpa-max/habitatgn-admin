import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const maintenanceTicketsCollectionRef = collection(db, 'maintenance_tickets')

export const maintenanceTicketDocRef = (id) => doc(db, 'maintenance_tickets', id)

export const getMaintenanceTickets = async () => {
  const q = query(maintenanceTicketsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addMaintenanceTicket = async (data) => {
  const payload = { ...data, createdAt: new Date() }
  const docRef = await addDoc(maintenanceTicketsCollectionRef, payload)
  return { id: docRef.id, ...payload }
}

export const editMaintenanceTicket = async (id, data) => {
  await updateDoc(maintenanceTicketDocRef(id), data)
}

export const deleteMaintenanceTicket = async (id) => {
  await deleteDoc(maintenanceTicketDocRef(id))
}
