import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import DashbordCard from '@/components/dashbord/dashbord'
import { useColors } from '@/contexts/ColorContext'
import { useNotifications } from '@/contexts/NotificationsContext'
import { db } from '@/lib/firebase/client_config'
import { computeWorkerPaymentStatus, getAllWorkerPayments } from '@/lib/services/workerPayments'
import { computeAgentPaymentStatus, getAllAgentPayments } from '@/lib/services/agentPayments'
import { RiArrowRightSLine, RiCheckboxCircleLine } from 'react-icons/ri'

import {
  AuthAction,
  useUser,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'

// Chaque compteur « à traiter » de NotificationsContext -> phrase + page.
const TODO_ITEMS = [
  { key: 'pendingAgents', one: 'agent à valider', many: 'agents à valider', href: '/agents' },
  { key: 'pendingWorkers', one: 'artisan à valider', many: 'artisans à valider', href: '/workers' },
  { key: 'pendingServiceRequests', one: 'demande de service à traiter', many: 'demandes de service à traiter', href: '/services' },
  { key: 'pendingBookings', one: 'réservation à confirmer', many: 'réservations à confirmer', href: '/reservations' },
  { key: 'pendingLeads', one: 'nouvelle demande de visite', many: 'nouvelles demandes de visite', href: '/leads' },
  { key: 'unreadMessages', one: 'message non lu', many: 'messages non lus', href: '/messages' },
  { key: 'pendingCareerApplications', one: 'candidature à étudier', many: 'candidatures à étudier', href: '/carrieres' },
]

const RENEWAL_WINDOW_DAYS = 7

/**
 * Formules Pro (période offerte ou payée) qui se terminent dans les 7 jours :
 * à relancer, le paiement étant manuel. Réservé à l'admin (paiements).
 */
function useProRenewals(enabled) {
  const [renewals, setRenewals] = useState({ workers: 0, agents: 0 })

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const soon = (status) => {
      if (status.status !== 'trial' && status.status !== 'active') return false
      const end = status.nextDueAt
      return end && end - Date.now() <= RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000
    }
    const byId = (payments, key) =>
      payments.reduce((map, p) => map.set(p[key], [...(map.get(p[key]) || []), p]), new Map())

    Promise.all([
      getDocs(query(collection(db, 'workers'), where('status', '==', 'approved'))),
      getDocs(query(collection(db, 'agent_requests'), where('status', '==', 'approved'))),
      getAllWorkerPayments(),
      getAllAgentPayments(),
    ])
      .then(([workers, agents, workerPayments, agentPayments]) => {
        if (cancelled) return
        const wp = byId(workerPayments, 'workerId')
        const ap = byId(agentPayments, 'agentId')
        setRenewals({
          workers: workers.docs.filter((d) => soon(computeWorkerPaymentStatus({ id: d.id, ...d.data() }, wp.get(d.id)))).length,
          agents: agents.docs.filter((d) => soon(computeAgentPaymentStatus({ id: d.id, ...d.data() }, ap.get(d.id)))).length,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled])

  return renewals
}

/** Accueil : ce qui attend une action, avant les statistiques. */
function TodoPanel() {
  const colors = useColors()
  const AuthUser = useUser()
  const notifications = useNotifications()
  const renewals = useProRenewals(AuthUser.claims?.userType === 'admin')

  const items = [
    ...TODO_ITEMS.map((item) => ({ ...item, count: notifications[item.key] || 0 })),
    { key: 'renewWorkers', one: 'formule Pro artisan à renouveler (7 jours)', many: 'formules Pro artisans à renouveler (7 jours)', href: '/workers', count: renewals.workers },
    { key: 'renewAgents', one: 'formule Pro agent à renouveler (7 jours)', many: 'formules Pro agents à renouveler (7 jours)', href: '/agents', count: renewals.agents },
  ].filter((item) => item.count > 0)

  const firstName = (AuthUser?.displayName || '').split(' ')[0]

  return (
    <div className="mb-6">
      <h1 className="text-lg font-extrabold" style={{ color: colors.gray900 }}>
        {firstName ? `Bonjour ${firstName}` : 'Bonjour'}
      </h1>
      <div className="mt-4 rounded-xl border bg-white shadow-sm" style={{ borderColor: colors.gray100 }}>
        <p className="border-b px-5 py-3 text-sm font-bold" style={{ color: colors.gray900, borderColor: colors.gray100 }}>
          À faire aujourd&apos;hui
        </p>
        {items.length === 0 ? (
          <p className="flex items-center gap-2 px-5 py-5 text-sm" style={{ color: colors.gray500 }}>
            <RiCheckboxCircleLine className="h-5 w-5" style={{ color: colors.success }} />
            Tout est à jour, rien n&apos;attend votre action.
          </p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.key} className="border-b last:border-b-0" style={{ borderColor: colors.gray100 }}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50">
                  <span
                    className="flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 text-xs font-bold text-white"
                    style={{ backgroundColor: colors.orangeAccent }}
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                  <span className="flex-1 text-sm font-medium" style={{ color: colors.gray800 }}>
                    {item.count > 1 ? item.many : item.one}
                  </span>
                  <RiArrowRightSLine className="h-5 w-5" style={{ color: colors.gray400 }} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Home() {
  return (
    <Scaffold>
      <TodoPanel />
      <DashbordCard />
    </Scaffold>
  )
}

const HomePage = () => (
  <Page name="Accueil | BâtiMoo Admin">
    <Home />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async () => {
  return {
    props: {},
  }
})
export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(HomePage)
