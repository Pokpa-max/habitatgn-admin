import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const propertyExpensesCollectionRef = collection(db, 'property_expenses')

export const propertyExpenseDocRef = (id) => doc(db, 'property_expenses', id)

export const getPropertyExpenses = async () => {
  const q = query(propertyExpensesCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addPropertyExpense = async (data) => {
  const payload = { ...data, createdAt: new Date() }
  const docRef = await addDoc(propertyExpensesCollectionRef, payload)
  return { id: docRef.id, ...payload }
}

export const deletePropertyExpense = async (id) => {
  await deleteDoc(propertyExpenseDocRef(id))
}
