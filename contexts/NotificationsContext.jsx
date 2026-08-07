import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onSnapshot, query, where } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client_config'
import { agentRequestsCollectionRef } from '@/lib/services/agentRequests'
import { workersCollectionRef } from '@/lib/services/workers'
import { contactMessagesCollectionRef } from '@/lib/services/contactMessages'
import { serviceRequestsCollectionRef, MAIN_CATEGORIES } from '@/lib/services/serviceRequests'
import { notify } from '@/utils/toast'

const CATEGORY_LABELS = {
  demenagement: 'de déménagement',
  'gestion-locative': 'de gestion locative',
  'securisation-fonciere': 'de sécurisation foncière',
}

const NotificationsContext = createContext({
  pendingAgents: 0,
  pendingWorkers: 0,
  unreadMessages: 0,
  pendingMovingRequests: 0,
  pendingRentalRequests: 0,
  pendingLegalRequests: 0,
  pendingArtisanRequests: 0,
  pendingServiceRequests: 0,
})

export function NotificationsProvider({ children }) {
  const [pendingAgents, setPendingAgents] = useState(0)
  const [pendingWorkers, setPendingWorkers] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [pendingMovingRequests, setPendingMovingRequests] = useState(0)
  const [pendingRentalRequests, setPendingRentalRequests] = useState(0)
  const [pendingLegalRequests, setPendingLegalRequests] = useState(0)
  const [pendingArtisanRequests, setPendingArtisanRequests] = useState(0)

  // null = not yet initialized (first snapshot = baseline, no toast)
  const knownAgentIds = useRef(null)
  const knownWorkerIds = useRef(null)
  const knownMessageIds = useRef(null)
  const knownServiceRequestIds = useRef(null)

  useEffect(() => {
    let unsubAgents = null
    let unsubWorkers = null
    let unsubMessages = null
    let unsubServiceRequests = null

    // Start Firestore listeners only once the user is authenticated
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous listeners on auth change
      if (unsubAgents) unsubAgents()
      if (unsubWorkers) unsubWorkers()
      if (unsubMessages) unsubMessages()
      if (unsubServiceRequests) unsubServiceRequests()
      knownAgentIds.current = null
      knownWorkerIds.current = null
      knownMessageIds.current = null
      knownServiceRequestIds.current = null

      if (!user) {
        setPendingAgents(0)
        setPendingWorkers(0)
        setUnreadMessages(0)
        setPendingMovingRequests(0)
        setPendingRentalRequests(0)
        setPendingLegalRequests(0)
        setPendingArtisanRequests(0)
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

      const qServiceRequests = query(
        serviceRequestsCollectionRef,
        where('status', '==', 'pending')
      )

      unsubServiceRequests = onSnapshot(qServiceRequests, (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ id: d.id, category: d.data().category }))
        const ids = new Set(docs.map((d) => d.id))

        setPendingMovingRequests(docs.filter((d) => d.category === 'demenagement').length)
        setPendingRentalRequests(docs.filter((d) => d.category === 'gestion-locative').length)
        setPendingLegalRequests(docs.filter((d) => d.category === 'securisation-fonciere').length)
        setPendingArtisanRequests(docs.filter((d) => !MAIN_CATEGORIES.includes(d.category)).length)

        if (knownServiceRequestIds.current === null) {
          knownServiceRequestIds.current = ids
        } else {
          const newOnes = docs.filter((d) => !knownServiceRequestIds.current.has(d.id))
          if (newOnes.length > 0) {
            const byCategory = newOnes.reduce((acc, d) => {
              const label = CATEGORY_LABELS[d.category] || "d'intervention"
              acc[label] = (acc[label] || 0) + 1
              return acc
            }, {})
            Object.entries(byCategory).forEach(([label, n]) => {
              notify(`${n} nouvelle${n > 1 ? 's' : ''} demande${n > 1 ? 's' : ''} ${label} !`, 'success')
            })
          }
          knownServiceRequestIds.current = ids
        }
      })
    })

    return () => {
      unsubAuth()
      if (unsubAgents) unsubAgents()
      if (unsubWorkers) unsubWorkers()
      if (unsubMessages) unsubMessages()
      if (unsubServiceRequests) unsubServiceRequests()
    }
  }, [])

  const pendingServiceRequests =
    pendingMovingRequests + pendingRentalRequests + pendingLegalRequests + pendingArtisanRequests

  return (
    <NotificationsContext.Provider
      value={{
        pendingAgents,
        pendingWorkers,
        unreadMessages,
        pendingMovingRequests,
        pendingRentalRequests,
        pendingLegalRequests,
        pendingArtisanRequests,
        pendingServiceRequests,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
