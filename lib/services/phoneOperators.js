import {
    collection,
    deleteDoc,
    doc,
    updateDoc,
    addDoc,
    getDocs,
    orderBy,
    query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const phoneOperatorsCollectionRef = collection(db, 'callPhoneOperators')

export const phoneOperatorDocRef = (id) => doc(db, `callPhoneOperators/${id}`)

export const getPhoneOperators = async () => {
    const q = query(phoneOperatorsCollectionRef, orderBy('operatorName'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const addPhoneOperator = async ({ operatorName, phoneNumber }) => {
    const data = { operatorName, phoneNumber }
    const docRef = await addDoc(phoneOperatorsCollectionRef, data)
    return { id: docRef.id, ...data }
}

export const editPhoneOperator = async (id, { operatorName, phoneNumber }) => {
    const data = { operatorName, phoneNumber }
    await updateDoc(phoneOperatorDocRef(id), data)
    return data
}

export const deletePhoneOperator = async (id) => {
    await deleteDoc(phoneOperatorDocRef(id))
}
