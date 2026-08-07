import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { fetchWithPost } from '@/utils/fetch'

export const agentRequestsCollectionRef = collection(db, 'agent_requests')

export const agentRequestDocRef = (id) => doc(db, 'agent_requests', id)

export const getAgentRequests = async () => {
  const q = query(agentRequestsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getAgentRequestByUserId = async (userId) => {
  if (!userId) return null
  try {
    const q = query(agentRequestsCollectionRef, where('userId', '==', userId))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      return docs.find((d) => d.status === 'approved') || docs[0]
    }
    const docRef = agentRequestDocRef(userId)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() }
    }
  } catch (err) {
    console.error('Erreur getAgentRequestByUserId:', err)
  }
  return null
}

export const approveAgentRequest = async (id, userId) => {
  await updateDoc(agentRequestDocRef(id), { status: 'approved' })
  if (userId) {
    await setDoc(doc(db, 'users', userId), { role: 'agent', type: 'agent' }, { merge: true })
    try {
      await fetchWithPost('/api/setCustomClaims', {
        uid: userId,
        role: 'agent',
        userType: 'agent',
      })
    } catch (err) {
      console.error('Erreur lors de la mise à jour des custom claims:', err)
    }
  }
}

export const rejectAgentRequest = async (id) => {
  await updateDoc(agentRequestDocRef(id), { status: 'rejected' })
}
