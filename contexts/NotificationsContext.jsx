import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { onSnapshot, query, where } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/client_config'
import { agentRequestsCollectionRef } from '@/lib/services/agentRequests'
import { workersCollectionRef } from '@/lib/services/workers'
import { notify } from '@/utils/toast'

const NotificationsContext = createContext({
  pendingAgents: 0,
  pendingWorkers: 0,
})

export function NotificationsProvider({ children }) {
  const [pendingAgents, setPendingAgents] = useState(0)
  const [pendingWorkers, setPendingWorkers] = useState(0)

  // null = not yet initialized (first snapshot = baseline, no toast)
  const knownAgentIds = useRef(null)
  const knownWorkerIds = useRef(null)

  useEffect(() => {
    let unsubAgents = null
    let unsubWorkers = null

    // Start Firestore listeners only once the user is authenticated
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Clean up previous listeners on auth change
      if (unsubAgents) unsubAgents()
      if (unsubWorkers) unsubWorkers()
      knownAgentIds.current = null
      knownWorkerIds.current = null

      if (!user) {
        setPendingAgents(0)
        setPendingWorkers(0)
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
    })

    return () => {
      unsubAuth()
      if (unsubAgents) unsubAgents()
      if (unsubWorkers) unsubWorkers()
    }
  }, [])

  return (
    <NotificationsContext.Provider value={{ pendingAgents, pendingWorkers }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationsContext)
