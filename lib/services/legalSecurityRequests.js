import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const legalSecurityRequestsCollectionRef = collection(db, 'legal_security_requests')

export const getLegalSecurityRequests = async () => {
  const q = query(legalSecurityRequestsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const updateLegalSecurityRequestStatus = async (id, status) => {
  await updateDoc(doc(db, 'legal_security_requests', id), { status })
}
