import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const careerApplicationsCollectionRef = collection(db, 'career_applications')

export const getAllCareerApplications = async () => {
  const q = query(careerApplicationsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const updateCareerApplicationStatus = async (id, status) => {
  await updateDoc(doc(db, 'career_applications', id), {
    status,
    updatedAt: serverTimestamp(),
  })
}
