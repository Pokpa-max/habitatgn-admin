import { Fragment, useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { Dialog, Transition } from '@headlessui/react'
import {
  RiMenuLine,
  RiCloseLine,
  RiLoader4Line,
  RiExternalLinkLine,
  RiSearchEyeLine,
  RiGroupLine,
  RiBookOpenLine,
  RiDashboardLine,
  RiLogoutBoxRLine,
  RiSettings3Line,
  RiBriefcaseLine,
  RiHammerLine,
  RiTeamLine,
  RiTruckLine,
  RiMailLine,
  RiBuildingLine,
  RiShoppingBag3Line,
  RiCalendarCheckLine,
  RiCalendarTodoLine,
  RiFileUserLine,
  RiLockPasswordLine,
  RiFlag2Line,
} from 'react-icons/ri'
import Link from 'next/link'
import { useUser } from 'next-firebase-auth'
import { useColors } from '../contexts/ColorContext'
import { useRouter } from 'next/router'
import { db } from '../lib/firebase/client_config'
import ChangePasswordModal from './ChangePasswordModal'
import Loader from './Loader'
import PushAlertsBanner from './PushAlertsBanner'
import { useNotifications } from '../contexts/NotificationsContext'

// Menu regroupé par usage. `badgeKey` : compteur « à traiter » affiché
// à côté de l'entrée (voir contexts/NotificationsContext).
const navigation = [
  { name: 'Accueil', href: '/', icon: RiDashboardLine, claims: ['admin', 'manager'] },

  { section: 'À traiter', name: 'Demandes de visite', href: '/leads', icon: RiCalendarTodoLine, claims: ['admin', 'manager'], module: 'leads', badgeKey: 'pendingLeads' },
  { section: 'À traiter', name: 'Réservations', href: '/reservations', icon: RiCalendarCheckLine, claims: ['admin', 'manager'], module: 'reservations', badgeKey: 'pendingBookings' },
  { section: 'À traiter', name: 'Recherches confiées', href: '/recherches', icon: RiSearchEyeLine, claims: ['admin', 'manager'], module: 'services', badgeKey: 'pendingPropertySearchRequests' },
  { section: 'À traiter', name: 'Demandes de service', href: '/services', icon: RiTruckLine, claims: ['admin', 'manager'], module: 'services', badgeKey: 'pendingServiceRequests' },
  { section: 'À traiter', name: 'Messages', href: '/messages', icon: RiMailLine, claims: ['admin', 'manager'], module: 'messages', badgeKey: 'unreadMessages' },
  { section: 'À traiter', name: 'Annonces signalées', href: '/signalements', icon: RiFlag2Line, claims: ['admin', 'manager'], module: 'properties' },
  { section: 'À traiter', name: 'Carrières', href: '/carrieres', icon: RiFileUserLine, claims: ['admin', 'manager'], module: 'careers', badgeKey: 'pendingCareerApplications' },

  { section: 'Professionnels', name: 'Agents', href: '/agents', icon: RiBriefcaseLine, claims: ['admin', 'manager'], module: 'agents', badgeKey: 'pendingAgents' },
  { section: 'Professionnels', name: 'Ouvriers', href: '/workers', icon: RiHammerLine, claims: ['admin', 'manager'], module: 'workers', badgeKey: 'pendingWorkers' },

  { section: 'Biens & produits', name: 'Gestion locative', href: '/gestion-locative', icon: RiBuildingLine, claims: ['admin', 'manager'], module: 'properties' },
  { section: 'Biens & produits', name: 'Marketplace', href: '/marketplace', icon: RiShoppingBag3Line, claims: ['admin', 'manager'], module: 'marketplace' },

  { section: 'Site', name: 'Publicité', href: '/advertising', icon: RiBookOpenLine, claims: ['admin', 'manager'], module: 'advertising' },
  { section: 'Site', name: 'Partenaires', href: '/partners', icon: RiTeamLine, claims: ['admin', 'manager'], module: 'partners' },

  { section: 'Administration', name: 'Utilisateurs', href: '/users', icon: RiGroupLine, claims: ['admin'] },
  { section: 'Administration', name: 'Paramètres', href: '/settings', icon: RiSettings3Line, claims: ['admin'] },
]

/**
 * Téléphone : les tableaux s'affichent en cartes (styles/globals.css). Chaque
 * cellule reçoit le nom de sa colonne (`data-label`), recopié des en-têtes,
 * y compris quand les lignes changent (filtres, onglets, pagination).
 */
function useTableCardLabels() {
  useEffect(() => {
    const root = document.querySelector('.admin-content')
    if (!root) return
    let frame = null
    const label = () => {
      frame = null
      root.querySelectorAll('table').forEach((table) => {
        const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim())
        if (!headers.length) return
        table.querySelectorAll('tbody tr').forEach((row) => {
          Array.from(row.children).forEach((cell, index) => {
            if (cell.tagName !== 'TD') return
            const text = headers[index] || ''
            if (cell.getAttribute('data-label') !== text) cell.setAttribute('data-label', text)
          })
        })
      })
    }
    label()
    const observer = new MutationObserver(() => {
      if (frame === null) frame = requestAnimationFrame(label)
    })
    observer.observe(root, { childList: true, subtree: true })
    return () => {
      observer.disconnect()
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [])
}

/** Entrée active aussi sur ses pages de détail (/agents/123 → « Agents »). */
const isActivePath = (currentPath, href) =>
  href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`)

/** Menu par sections, avec le nombre d'éléments en attente. */
function NavSections({ items, currentPath, onNavigate }) {
  const counts = useNotifications()
  // Page demandée en cours de chargement : marquée tout de suite, et un
  // second clic ne relance pas la navigation (elle repartait de zéro)
  const [pendingHref, setPendingHref] = useState(null)
  const router = useRouter()
  useEffect(() => {
    const reset = () => setPendingHref(null)
    router.events.on('routeChangeComplete', reset)
    router.events.on('routeChangeError', reset)
    return () => {
      router.events.off('routeChangeComplete', reset)
      router.events.off('routeChangeError', reset)
    }
  }, [router.events])
  let lastSection
  return items.map((item) => {
    const heading = item.section && item.section !== lastSection ? item.section : null
    lastSection = item.section
    const isPending = pendingHref === item.href
    const isActive = isPending || (!pendingHref && isActivePath(currentPath, item.href))
    const count = item.badgeKey ? counts?.[item.badgeKey] || 0 : 0
    return (
      <Fragment key={item.href}>
        {heading && (
          <p className="mt-3 border-t px-4 pt-5 pb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: SIDEBAR_HEADING, borderColor: SIDEBAR_BORDER }}>
            {heading}
          </p>
        )}
        <Link
          href={item.href}
          aria-current={isActive ? 'page' : undefined}
          aria-busy={isPending || undefined}
          className={`nav-item-inactive flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2 ${item.href === '/' ? 'mb-2' : ''} ${isActive ? 'nav-item-active' : ''}`}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
            if (isPending || currentPath === item.href) {
              // Déjà en cours ou déjà sur la page : rien à relancer
              event.preventDefault()
              onNavigate?.()
              return
            }
            setPendingHref(item.href)
            onNavigate?.()
          }}>
          {isPending ? (
            <RiLoader4Line className="h-[17px] w-[17px] flex-shrink-0 animate-spin" />
          ) : (
            <item.icon className="h-[17px] w-[17px] flex-shrink-0" />
          )}
          <span className="flex-1 truncate text-[13px]">{item.name}</span>
          {count > 0 && (
            <span aria-label={`${count} élément${count > 1 ? 's' : ''} à traiter`} className={`nav-badge min-w-[20px] rounded-full px-1.5 py-1 text-center text-[10px] font-semibold leading-none ${isActive ? 'nav-badge-active' : ''}`}>
              {count > 99 ? '99+' : count}
            </span>
          )}
        </Link>
      </Fragment>
    );
  });
}

// Nuances dérivées du navy de la charte (colors.navyDark), utilisées
// uniquement pour le fond de la barre latérale — cf. proposition de palette
// admin validée (sidebar sombre pour faire ressortir primaire/orange).
const SIDEBAR_HOVER_BG = '#15263F'
const SIDEBAR_ACTIVE_BG = '#1E3252'
const SIDEBAR_TEXT = '#93A6C4'
const SIDEBAR_BORDER = '#1E3252'
const SIDEBAR_HEADING = '#5F7598'

export default function Scaffold({ children, title, subNav }) {
  const colors = useColors()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  // Le temps que AuthUser.signOut() se termine puis que la redirection vers
  // /auth/login se déclenche, AuthUser.claims devient déjà vide — sans ce
  // flag, canSeeNavItem masque tout le menu pendant ce court instant,
  // donnant l'impression que le menu "disparaît" avant la déconnexion.
  const [signingOut, setSigningOut] = useState(false)
  const AuthUser = useUser()
  const userType = AuthUser.claims?.userType || AuthUser.claims?.role
  const router = useRouter()
  // Purement cosmétique (masque les items non autorisés) — la vraie barrière
  // est le check SSR par page (voir utils/firebase/checkManagerAccess.js).
  // null tant que non chargé = ne rien masquer, pour éviter un flash de nav
  // incomplète le temps de la lecture Firestore.
  const [managerPermissions, setManagerPermissions] = useState(null)
  const [managerPermissionUserId, setManagerPermissionUserId] = useState(null)

  useEffect(() => {
    if (userType !== 'manager' || !AuthUser.id) {
      setManagerPermissions(null)
      setManagerPermissionUserId(null)
      return
    }
    let cancelled = false
    setManagerPermissionUserId(AuthUser.id)
    setManagerPermissions(null)
    getDoc(doc(db, 'users', AuthUser.id))
      .then((snap) => {
        if (cancelled) return
        setManagerPermissions(
          Array.isArray(snap.data()?.permissions) ? snap.data().permissions : []
        )
      })
      .catch(() => {
        if (!cancelled) setManagerPermissions([])
      })
    return () => {
      cancelled = true
    }
  }, [userType, AuthUser.id])

  const canSeeNavItem = (item) => {
    if (!item.claims.includes(userType)) return false
    if (userType !== 'manager' || !item.module) return true
    if (managerPermissionUserId !== AuthUser.id || managerPermissions === null) return false
    return managerPermissions.includes(item.module)
  }

  const currentPath = router.pathname
  useTableCardLabels()
  const counts = useNotifications()
  const visibleNav = navigation.filter(canSeeNavItem)
  const currentNavItem =
    visibleNav.find((item) => item.href !== '/' && isActivePath(currentPath, item.href)) ||
    (currentPath === '/' ? visibleNav.find((item) => item.href === '/') : null)
  const pendingTotal = visibleNav.reduce((sum, item) => sum + (item.badgeKey ? counts?.[item.badgeKey] || 0 : 0), 0)

  const handleSignOut = () => {
    setSigningOut(true)
    AuthUser.signOut()
  }

  return (
    <>
      <style>{`
        @keyframes slideInLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .sidebar-mobile {
          animation: slideInLeft 0.25s ease-out;
        }

        .nav-item-active {
          color: #FFFFFF;
          background-color: ${SIDEBAR_ACTIVE_BG};
          font-weight: 600;
          border-left: 3px solid ${colors.orangeAccent};
        }

        .nav-item-active svg {
          color: ${colors.orangeAccent};
        }

        .nav-badge {
          color: ${colors.orangeAccent};
          background-color: rgba(255, 255, 255, 0.09);
        }

        .nav-badge-active {
          color: #FFFFFF;
          background-color: ${colors.orangeAccent};
        }

        .nav-item-inactive {
          color: ${SIDEBAR_TEXT};
          border-left: 3px solid transparent;
          transition: all 0.15s ease-in-out;
        }

        .nav-item-inactive:hover {
          color: #FFFFFF;
          background-color: ${SIDEBAR_HOVER_BG};
        }

        .nav-item-inactive:focus-visible {
          outline: 2px solid ${colors.orangeAccent};
          outline-offset: 2px;
        }

        .logout-btn {
          color: ${SIDEBAR_TEXT};
          transition: color 0.15s ease;
        }

        .logout-btn:hover {
          color: ${colors.error};
        }
      `}</style>

      <ChangePasswordModal open={passwordModalOpen} setOpen={setPasswordModalOpen} />

      {signingOut && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Loader size={10} />
        </div>
      )}

      <div className="relative">
        {/* Mobile Sidebar */}
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-40 flex md:hidden"
            onClose={setSidebarOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay
                className="fixed inset-0"
                style={{ backgroundColor: `rgba(0, 0, 0, 0.4)` }}
              />
            </Transition.Child>

            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div
                className="sidebar-mobile relative flex w-full max-w-xs flex-1 flex-col"
                style={{ backgroundColor: colors.navyDark, paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
              >
                {/* Close Button */}
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-11 pt-2" style={{ marginTop: 'env(safe-area-inset-top)' }}>
                    <button
                      type="button"
                      className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Fermer menu</span>
                      <RiCloseLine className="h-5 w-5 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>

                {/* Logo Mobile */}
                <div
                  className="flex h-16 flex-shrink-0 items-center border-b px-6 gap-2.5"
                  style={{ borderColor: SIDEBAR_BORDER }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/logo-mark-white.png" alt="" className="h-8 w-auto" />
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-bold tracking-tight leading-none text-white">
                      BâtiMoo
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: colors.orangeAccent }}>
                        Admin
                      </span>
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: SIDEBAR_TEXT }}>
                      Administration
                    </p>
                  </div>
                </div>

                {/* Navigation Mobile */}
                <div className="h-0 flex-1 overflow-y-auto py-4 scrollbar-hide">
                  <nav className="space-y-0.5 px-2">
                    <NavSections
                      items={navigation.filter(canSeeNavItem)}
                      currentPath={currentPath}
                      onNavigate={() => setSidebarOpen(false)}
                    />
                  </nav>
                </div>

                {/* User Mobile */}
                <div className="flex flex-shrink-0 flex-col border-t p-4" style={{ borderColor: SIDEBAR_BORDER }}>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {AuthUser?.displayName || 'Utilisateur'}
                    </p>
                    <p className="text-xs" style={{ color: SIDEBAR_TEXT }}>
                      {userType === 'admin' ? 'Administrateur' : 'Manager'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSidebarOpen(false)
                      setPasswordModalOpen(true)
                    }}
                    className="logout-btn mt-3 flex w-full items-center gap-2 text-xs font-medium"
                  >
                    <RiLockPasswordLine className="h-4 w-4" />
                    Changer le mot de passe
                  </button>
                </div>
              </div>
            </Transition.Child>

            <div className="w-14 flex-shrink-0" />
          </Dialog>
        </Transition.Root>

        {/* Desktop Sidebar */}
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-60 md:flex-col">
          <div
            className="flex min-h-0 flex-1 flex-col"
            style={{ backgroundColor: colors.navyDark }}
          >
            {/* Logo Desktop */}
            <div
              className="flex h-16 flex-shrink-0 items-center border-b px-6 gap-2.5"
              style={{ borderColor: SIDEBAR_BORDER }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/logo-mark-white.png" alt="" className="h-8 w-auto" />
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold tracking-tight leading-none text-white">
                  BâtiMoo
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: colors.orangeAccent }}>
                    Admin
                  </span>
                </p>

                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: SIDEBAR_TEXT }}>
                  Administration
                </p>
              </div>
            </div>

            {/* Navigation Desktop */}
            <div className="h-0 flex-1 overflow-y-auto py-4 scrollbar-hide">
              <nav className="space-y-0.5 px-3">
                <NavSections items={navigation.filter(canSeeNavItem)} currentPath={currentPath} />
              </nav>
            </div>

            {/* User Section Desktop */}
            <div className="flex flex-shrink-0 border-t p-4" style={{ borderColor: SIDEBAR_BORDER }}>
              <div className="w-full">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm"
                    style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                  >
                    {(AuthUser?.displayName?.[0] || 'A').toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-semibold text-white">
                      {AuthUser?.displayName || 'Utilisateur'}
                    </p>
                    <p className="text-xs" style={{ color: SIDEBAR_TEXT }}>
                      {userType === 'admin' ? 'Administrateur' : 'Manager'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPasswordModalOpen(true)}
                  className="logout-btn mt-3 flex w-full items-center gap-2 text-xs font-medium"
                >
                  <RiLockPasswordLine className="h-4 w-4" />
                  Changer le mot de passe
                </button>
                <button
                  onClick={handleSignOut}
                  className="logout-btn mt-1.5 flex w-full items-center gap-2 text-xs font-medium"
                >
                  <RiLogoutBoxRLine className="h-4 w-4" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col md:pl-60">
          {/* Top Bar Mobile */}
          <div
            className="sticky top-0 z-30 md:hidden"
            style={{ backgroundColor: colors.navyDark, paddingTop: 'env(safe-area-inset-top)' }}
          >
            <div className="flex h-14 items-center gap-1 px-2">
              <button
                type="button"
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/90 active:bg-white/10"
                onClick={() => setSidebarOpen(true)}
                aria-label={pendingTotal > 0 ? `Ouvrir le menu, ${pendingTotal} à traiter` : 'Ouvrir le menu'}
              >
                <RiMenuLine className="h-6 w-6" aria-hidden="true" />
                {pendingTotal > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
                    style={{ backgroundColor: colors.orangeAccent, boxShadow: `0 0 0 2px ${colors.navyDark}` }}
                  >
                    {pendingTotal > 99 ? '99+' : pendingTotal}
                  </span>
                )}
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/logo-mark-white.png" alt="" className="ml-1 h-6 w-auto" />
              {/* Marque seule : le titre de la page est juste en dessous */}
              <div className="ml-2 min-w-0">
                <p className="flex items-center gap-1.5 text-[15px] font-bold leading-none text-white">
                  BâtiMoo
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: colors.orangeAccent }}>
                    Admin
                  </span>
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase leading-none tracking-wider" style={{ color: SIDEBAR_TEXT }}>
                  Administration
                </p>
              </div>
            </div>
          </div>

          {/* Ordinateur : page en cours, accès au site */}
          <header
            className="sticky top-0 z-20 hidden h-14 items-center gap-4 border-b bg-white/95 px-8 backdrop-blur md:flex"
            style={{ borderColor: colors.gray200 }}
          >
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="truncate font-semibold text-gray-900">{currentNavItem?.name || 'BâtiMoo'}</span>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-3">
              {pendingTotal > 0 && (
                <span className="text-xs text-gray-500">
                  <strong className="text-gray-900">{pendingTotal}</strong> à traiter
                </span>
              )}
              <a
                href="https://www.batimoo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <RiExternalLinkLine className="h-3.5 w-3.5" />
                Voir le site
              </a>
              <span className="flex items-center gap-2 border-l border-gray-200 pl-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                >
                  {(AuthUser?.displayName?.[0] || 'A').toUpperCase()}
                </span>
                <span className="leading-tight">
                  <span className="block max-w-[10rem] truncate text-xs font-semibold text-gray-900">{AuthUser?.displayName || 'Utilisateur'}</span>
                  <span className="block text-[11px] text-gray-500">{userType === 'admin' ? 'Administrateur' : 'Manager'}</span>
                </span>
              </span>
            </div>
          </header>

          {/* Alertes push : bandeau tant qu'elles ne sont pas activées sur cet appareil */}
          <PushAlertsBanner />

          {/* Content */}
          {subNav ? (
            subNav
          ) : (
            <main
              className="admin-content min-h-screen min-w-0 w-full flex-1"
              style={{ backgroundColor: colors.gray50 }}
            >
              <div className="min-w-0 flex-1 py-4 sm:py-8">
                {title && (
                  <div className="mx-auto mb-4 max-w-7xl px-3 sm:mb-5 sm:px-6 md:px-8">
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: colors.gray900 }}>
                      {title}
                    </h1>
                  </div>
                )}
                <div className="mx-auto min-w-0 max-w-7xl px-3 sm:px-6 md:px-8">
                  {children}
                </div>
              </div>
            </main>
          )}
        </div>
      </div>
    </>
  )
}
