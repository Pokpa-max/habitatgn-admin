import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import DashbordCard from '@/components/dashbord/dashbord'
import { useColors } from '@/contexts/ColorContext'
import { useNotifications } from '@/contexts/NotificationsContext'
import { RiSearchLine, RiNotification3Line } from 'react-icons/ri'

import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

// Chaque compteur réel de NotificationsContext -> libellé + destination.
const NOTIFICATION_ITEMS = [
  { key: 'pendingLeads', label: 'nouvelle(s) demande(s) de visite', href: '/leads' },
  { key: 'pendingAgents', label: 'candidature(s) agent en attente', href: '/agents' },
  { key: 'pendingWorkers', label: 'profil(s) ouvrier en attente', href: '/workers' },
  { key: 'unreadMessages', label: 'message(s) de contact non lu(s)', href: '/messages' },
  { key: 'pendingBookings', label: 'réservation(s) en attente', href: '/reservations' },
  { key: 'pendingServiceRequests', label: 'demande(s) de service en attente', href: '/services' },
  { key: 'pendingCareerApplications', label: 'candidature(s) carrière en attente', href: '/carrieres' },
]

// Barre supérieure du Dashboard — reproduit exactement la proposition de
// palette validée : titre "Vue d'ensemble", champ de recherche, icône de
// notification avec pastille. Propre à cette page (pas dans Scaffold),
// à la demande explicite de l'utilisateur. La pastille et le menu sont
// branchés sur les vrais compteurs de NotificationsContext.
function DashboardTopbar() {
  const colors = useColors()
  const notifications = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const items = NOTIFICATION_ITEMS.map((item) => ({
    ...item,
    count: notifications[item.key] || 0,
  })).filter((item) => item.count > 0)
  const totalCount = items.reduce((sum, item) => sum + item.count, 0)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-lg font-extrabold" style={{ color: colors.gray900 }}>
        Vue d&apos;ensemble
      </h1>
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: colors.gray200, backgroundColor: colors.gray50, color: colors.gray500 }}
        >
          <RiSearchLine className="h-3.5 w-3.5 opacity-70" />
          Rechercher…
        </div>
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: colors.gray200 }}
          >
            <RiNotification3Line className="h-4 w-4" style={{ color: colors.gray500 }} />
            {totalCount > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ backgroundColor: colors.orangeAccent }}
              >
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </button>

          {open && (
            <div
              className="absolute right-0 top-11 z-20 w-72 overflow-hidden rounded-xl border bg-white shadow-lg"
              style={{ borderColor: colors.gray200 }}
            >
              <div className="border-b px-4 py-3" style={{ borderColor: colors.gray100 }}>
                <p className="text-sm font-bold" style={{ color: colors.gray900 }}>
                  Notifications
                </p>
              </div>
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs" style={{ color: colors.gray500 }}>
                  Aucune notification
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {items.map((item) => (
                    <Link key={item.key} href={item.href}>
                      <a
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50"
                        style={{ borderBottom: `1px solid ${colors.gray100}` }}
                      >
                        <span
                          className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
                          style={{ backgroundColor: colors.orangeAccent }}
                        >
                          {item.count}
                        </span>
                        <span className="text-sm" style={{ color: colors.gray700 }}>
                          {item.count} {item.label}
                        </span>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Home() {
  return (
    <Scaffold>
      <DashboardTopbar />
      <DashbordCard />
    </Scaffold>
  )
}

const HomePage = () => (
  <Page name="Accueil | BâtiMoo Admin">
    <Home />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async () => {
  return {
    props: {},
  }
})
export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(HomePage)
