import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

const postingsRef = collection(db, 'career_postings')

export const getAllCareerPostings = async () => {
  const snapshot = await getDocs(query(postingsRef, orderBy('createdAt', 'desc')))
  return snapshot.docs.map((posting) => ({ id: posting.id, ...posting.data() }))
}

export const saveCareerPosting = async ({ id, ...posting }) => {
  const payload = {
    title: posting.title.trim(),
    department: posting.department.trim(),
    location: posting.location.trim(),
    employmentType: posting.employmentType.trim(),
    description: posting.description.trim(),
    requirements: posting.requirements.trim(),
    status: posting.status,
    updatedAt: serverTimestamp(),
  }

  if (id) {
    await updateDoc(doc(db, 'career_postings', id), payload)
    return id
  }

  const created = await addDoc(postingsRef, { ...payload, createdAt: serverTimestamp() })
  return created.id
}

export const deleteCareerPosting = (id) => deleteDoc(doc(db, 'career_postings', id))
