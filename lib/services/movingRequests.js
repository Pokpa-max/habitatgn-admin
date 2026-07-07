import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const movingRequestsCollectionRef = collection(db, 'moving_requests')

export const getMovingRequests = async () => {
  const q = query(movingRequestsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const updateMovingRequestStatus = async (id, status) => {
  await updateDoc(doc(db, 'moving_requests', id), { status })
}
