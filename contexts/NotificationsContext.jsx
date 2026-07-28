import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onSnapshot, query, where } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client_config'
import { agentRequestsCollectionRef } from '@/lib/services/agentRequests'
import { workersCollectionRef } from '@/lib/services/workers'
import { contactMessagesCollectionRef } from '@/lib/services/contactMessages'
import { movingRequestsCollectionRef } from '@/lib/services/movingRequests'
import { rentalManagementRequestsCollectionRef } from '@/lib/services/rentalManagementRequests'
import { legalSecurityRequestsCollectionRef } from '@/lib/services/legalSecurityRequests'
import { notify } from '@/utils/toast'

const NotificationsContext = createContext({
  pendingAgents: 0,
  pendingWorkers: 0,
  unreadMessages: 0,
  pendingMovingRequests: 0,
  pendingRentalRequests: 0,
  pendingLegalRequests: 0,
  pendingServiceRequests: 0,
})

export function NotificationsProvider({ children }) {
  const [pendingAgents, setPendingAgents] = useState(0)
  const [pendingWorkers, setPendingWorkers] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingMovingRequests, setPendingMovingRequests] = useState(0)
  const [pendingRentalRequests, setPendingRentalRequests] = useState(0)
  const [pendingLegalRequests, setPendingLegalRequests] = useState(0)

  // null = not yet initialized (first snapshot = baseline, no toast)
  const knownAgentIds = useRef(null)
  const knownWorkerIds = useRef(null)
  const knownMessageIds = useRef(null)
  const knownMovingIds = useRef(null)
  const knownRentalIds = useRef(null)
  const knownLegalIds = useRef(null)

  useEffect(() => {
    let unsubAgents = null
    let unsubWorkers = null
    let unsubMessages = null
    let unsubMoving = null
    let unsubRental = null
    let unsubLegal = null

    // Start Firestore listeners only once the user is authenticated
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous listeners on auth change
      if (unsubAgents) unsubAgents()
      if (unsubWorkers) unsubWorkers()
      if (unsubMessages) unsubMessages()
      if (unsubMoving) unsubMoving()
      if (unsubRental) unsubRental()
      if (unsubLegal) unsubLegal()
      knownAgentIds.current = null
      knownWorkerIds.current = null
      knownMessageIds.current = null
      knownMovingIds.current = null
      knownRentalIds.current = null
      knownLegalIds.current = null

      if (!user) {
        setPendingAgents(0)
        setPendingWorkers(0)
        setUnreadMessages(0)
        setPendingMovingRequests(0)
        setPendingRentalRequests(0)
        setPendingLegalRequests(0)
        return
      }

      const qAgents = query(
        agentRequestsCollectionRef,
        where('status', '==', 'pending')
      )

      unsubAgents = onSnapshot(qAgents, (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id))
        setPendingAgents(ids.size)

        if (knownAgentIds.current === null) {
          // First load — record baseline, no toast
          knownAgentIds.current = ids
        } else {
          const newOnes = [...ids].filter((id) => !knownAgentIds.current.has(id))
          if (newOnes.length > 0) {
            const n = newOnes.length
            notify(
              `${n} nouvelle${n > 1 ? 's' : ''} candidature${n > 1 ? 's' : ''} agent !`,
              'success'
            )
          }
          knownAgentIds.current = ids
        }
      })

      const qWorkers = query(
        workersCollectionRef,
        where('status', '==', 'pending')
      )

      unsubWorkers = onSnapshot(qWorkers, (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id))
        setPendingWorkers(ids.size)

        if (knownWorkerIds.current === null) {
          knownWorkerIds.current = ids
        } else {
          const newOnes = [...ids].filter((id) => !knownWorkerIds.current.has(id))
          if (newOnes.length > 0) {
            const n = newOnes.length
            notify(
              `${n} nouveau${n > 1 ? 'x' : ''} profil${n > 1 ? 's' : ''} ouvrier en attente !`,
              'success'
            )
          }
          knownWorkerIds.current = ids
        }
      })

      const qMessages = query(
        contactMessagesCollectionRef,
        where('read', '==', false)
      )

      unsubMessages = onSnapshot(qMessages, (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id))
        setUnreadMessages(ids.size)

        if (knownMessageIds.current === null) {
          knownMessageIds.current = ids
        } else {
          const newOnes = [...ids].filter((id) => !knownMessageIds.current.has(id))
          if (newOnes.length > 0) {
            const n = newOnes.length
            notify(
              `${n} nouveau${n > 1 ? 'x' : ''} message${n > 1 ? 's' : ''} de contact !`,
              'success'
            )
          }
          knownMessageIds.current = ids
        }
      })

      const qMoving = query(
        movingRequestsCollectionRef,
        where('status', '==', 'pending')
      )

      unsubMoving = onSnapshot(qMoving, (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id))
        setPendingMovingRequests(ids.size)

        if (knownMovingIds.current === null) {
          knownMovingIds.current = ids
        } else {
          const newOnes = [...ids].filter((id) => !knownMovingIds.current.has(id))
          if (newOnes.length > 0) {
            const n = newOnes.length
            notify(
              `${n} nouvelle${n > 1 ? 's' : ''} demande${n > 1 ? 's' : ''} de déménagement !`,
              'success'
            )
          }
          knownMovingIds.current = ids
        }
      })

      const qRental = query(
        rentalManagementRequestsCollectionRef,
        where('status', '==', 'pending')
      )

      unsubRental = onSnapshot(qRental, (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id))
        setPendingRentalRequests(ids.size)

        if (knownRentalIds.current === null) {
          knownRentalIds.current = ids
        } else {
          const newOnes = [...ids].filter((id) => !knownRentalIds.current.has(id))
          if (newOnes.length > 0) {
            const n = newOnes.length
            notify(
              `${n} nouvelle${n > 1 ? 's' : ''} demande${n > 1 ? 's' : ''} de gestion locative !`,
              'success'
            )
          }
          knownRentalIds.current = ids
        }
      })

      const qLegal = query(
        legalSecurityRequestsCollectionRef,
        where('status', '==', 'pending')
      )

      unsubLegal = onSnapshot(qLegal, (snapshot) => {
        const ids = new Set(snapshot.docs.map((d) => d.id))
        setPendingLegalRequests(ids.size)

        if (knownLegalIds.current === null) {
          knownLegalIds.current = ids
        } else {
          const newOnes = [...ids].filter((id) => !knownLegalIds.current.has(id))
          if (newOnes.length > 0) {
            const n = newOnes.length
            notify(
              `${n} nouvelle${n > 1 ? 's' : ''} demande${n > 1 ? 's' : ''} de sécurisation foncière !`,
              'success'
            )
          }
          knownLegalIds.current = ids
        }
      })
    })

    return () => {
      unsubAuth()
      if (unsubAgents) unsubAgents()
      if (unsubWorkers) unsubWorkers()
      if (unsubMessages) unsubMessages()
      if (unsubMoving) unsubMoving()
      if (unsubRental) unsubRental()
      if (unsubLegal) unsubLegal()
    }
  }, [])

  const pendingServiceRequests = pendingMovingRequests + pendingRentalRequests + pendingLegalRequests

  return (
    <NotificationsContext.Provider
      value={{
        pendingAgents,
        pendingWorkers,
        unreadMessages,
        pendingMovingRequests,
        pendingRentalRequests,
        pendingLegalRequests,
        pendingServiceRequests,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
