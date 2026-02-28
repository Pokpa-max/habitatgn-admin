import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onSnapshot, query, where, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client_config'
import { dailyBookingsCollectionRef } from '@/lib/services/dailyBookings'
import { serviceRequestsCollectionRef } from '@/lib/services/serviceRequests'
import { notify } from '@/utils/toast'

const NotificationsContext = createContext({
  pendingBookings: 0,
  pendingServices: 0,
})

export function NotificationsProvider({ children }) {
  const [pendingBookings, setPendingBookings] = useState(0)
  const [pendingServices, setPendingServices] = useState(0)

  // null = not yet initialized (first snapshot = baseline, no toast)
  const knownBookingIds = useRef(null)
  const knownServiceIds = useRef(null)

  useEffect(() => {
    let unsubBookings = null
    let unsubServices = null

    // Start Firestore listeners only once the user is authenticated
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous listeners on auth change
      if (unsubBookings) unsubBookings()
      if (unsubServices) unsubServices()
      knownBookingIds.current = null
      knownServiceIds.current = null

      if (!user) {
        setPendingBookings(0)
        setPendingServices(0)
        return
      }

      const qBookings = query(
        dailyBookingsCollectionRef,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      )

      unsubBookings = onSnapshot(qBookings, (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id))
        setPendingBookings(ids.size)

        if (knownBookingIds.current === null) {
          // First load — record baseline, no toast
          knownBookingIds.current = ids
        } else {
          const newOnes = [...ids].filter((id) => !knownBookingIds.current.has(id))
          if (newOnes.length > 0) {
            const n = newOnes.length
            notify(
              `${n} nouvelle${n > 1 ? 's' : ''} réservation${n > 1 ? 's' : ''} en attente !`,
              'success'
            )
          }
          knownBookingIds.current = ids
        }
      })

      const qServices = query(
        serviceRequestsCollectionRef,
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      )

      unsubServices = onSnapshot(qServices, (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id))
        setPendingServices(ids.size)

        if (knownServiceIds.current === null) {
          knownServiceIds.current = ids
        } else {
          const newOnes = [...ids].filter((id) => !knownServiceIds.current.has(id))
          if (newOnes.length > 0) {
            const n = newOnes.length
            notify(
              `${n} nouvelle${n > 1 ? 's' : ''} demande${n > 1 ? 's' : ''} de service !`,
              'success'
            )
          }
          knownServiceIds.current = ids
        }
      })
    })

    return () => {
      unsubAuth()
      if (unsubBookings) unsubBookings()
      if (unsubServices) unsubServices()
    }
  }, [])

  return (
    <NotificationsContext.Provider value={{ pendingBookings, pendingServices }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
