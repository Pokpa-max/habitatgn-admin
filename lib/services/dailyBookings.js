import {
    collection,
    deleteDoc,
    doc,
    updateDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const dailyBookingsCollectionRef = collection(db, 'daily_bookings')

export const dailyBookingDocRef = (id) => doc(db, `daily_bookings/${id}`)

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

export const getDailyBookings = async () => {
    const q = query(dailyBookingsCollectionRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) =>
        deepSerialize({ id: d.id, ...d.data() })
    )
}

export const updateBookingStatus = async (id, status) => {
    await updateDoc(dailyBookingDocRef(id), {
        status,
        updatedAt: serverTimestamp(),
    })
}

export const deleteDailyBooking = async (id) => {
    await deleteDoc(dailyBookingDocRef(id))
}

// Real-time listener — returns the unsubscribe function
export const subscribeDailyBookings = (callback) => {
    const q = query(dailyBookingsCollectionRef, orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) =>
            deepSerialize({ id: d.id, ...d.data() })
        )
        callback(data)
    })
}
