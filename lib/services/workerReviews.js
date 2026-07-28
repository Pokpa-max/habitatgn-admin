import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { workerDocRef } from '@/lib/services/workers'

const reviewsCollectionRef = (workerId) => collection(db, 'workers', workerId, 'reviews')

export const getWorkerReviews = async (workerId) => {
  const q = query(reviewsCollectionRef(workerId), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const deleteWorkerReview = async (workerId, reviewId) => {
  await deleteDoc(doc(db, 'workers', workerId, 'reviews', reviewId))

  const remaining = await getWorkerReviews(workerId)
  const rating = remaining.length
    ? Math.round((remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length) * 10) / 10
    : 0
  await updateDoc(workerDocRef(workerId), {
    rating,
    reviewsCount: remaining.length,
  })

  return remaining
}
