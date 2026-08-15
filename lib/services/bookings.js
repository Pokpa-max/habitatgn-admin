import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const bookingsCollectionRef = collection(db, 'daily_bookings')

export const getAllBookings = async () => {
  const q = query(bookingsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Même signature que bookingService.ts côté site public : un statut, rien d'autre.
export const updateBookingStatus = async (id, status) => {
  await updateDoc(doc(db, 'daily_bookings', id), { status })
}

export const getDailyRentalById = async (id) => {
  if (!id) return null
  const snap = await getDoc(doc(db, 'daily_rentals', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
