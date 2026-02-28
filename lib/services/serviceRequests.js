import {
    collection,
    deleteDoc,
    doc,
    updateDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const serviceRequestsCollectionRef = collection(db, 'service_requests')

export const serviceRequestDocRef = (id) => doc(db, `service_requests/${id}`)

const deepSerialize = (value) => {
    if (value === null || value === undefined) return value
    if (typeof value.toDate === 'function') return value.toDate().toISOString()
    if (Array.isArray(value)) return value.map(deepSerialize)
    if (typeof value === 'object') {
        const result = {}
        for (const [k, v] of Object.entries(value)) {
            result[k] = deepSerialize(v)
        }
        return result
    }
    return value
}

export const getServiceRequests = async () => {
    const q = query(serviceRequestsCollectionRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) =>
        deepSerialize({ id: d.id, ...d.data() })
    )
}

export const updateServiceRequestStatus = async (id, status) => {
    await updateDoc(serviceRequestDocRef(id), {
        status,
        updatedAt: serverTimestamp(),
    })
}

export const deleteServiceRequest = async (id) => {
    await deleteDoc(serviceRequestDocRef(id))
}
