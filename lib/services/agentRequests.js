import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const agentRequestsCollectionRef = collection(db, 'agent_requests')

export const agentRequestDocRef = (id) => doc(db, 'agent_requests', id)

export const getAgentRequests = async () => {
  const q = query(agentRequestsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getAgentRequestByUserId = async (userId) => {
  const q = query(agentRequestsCollectionRef, where('userId', '==', userId))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  return docs.find((d) => d.status === 'approved') || docs[0]
}

export const approveAgentRequest = async (id, userId) => {
  await updateDoc(agentRequestDocRef(id), { status: 'approved' })
  if (userId) {
    await setDoc(doc(db, 'users', userId), { role: 'agent' }, { merge: true })
  }
}

export const rejectAgentRequest = async (id) => {
  await updateDoc(agentRequestDocRef(id), { status: 'rejected' })
}
