import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const rentalManagementRequestsCollectionRef = collection(db, 'rental_management_requests')

export const getRentalManagementRequests = async () => {
  const q = query(rentalManagementRequestsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const updateRentalManagementRequestStatus = async (id, status) => {
  await updateDoc(doc(db, 'rental_management_requests', id), { status })
}
