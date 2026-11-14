import { Fragment, useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { Dialog, Transition } from '@headlessui/react'
import {
  RiMenuLine,
  RiCloseLine,
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
  { section: 'À traiter', name: 'Demandes de service', href: '/services', icon: RiTruckLine, claims: ['admin', 'manager'], module: 'services', badgeKey: 'pendingServiceRequests' },
  { section: 'À traiter', name: 'Messages', href: '/messages', icon: RiMailLine, claims: ['admin', 'manager'], module: 'messages', badgeKey: 'unreadMessages' },
  { section: 'À traiter', name: 'Annonces signalées', href: '/signalements', icon: RiFlag2Line, claims: ['admin', 'manager'], module: 'properties' },
  { section: 'À traiter', name: 'Carrières', href: '/carrieres', icon: RiFileUserLine, claims: ['admin', 'manager'], module: 'careers', badgeKey: 'pendingCareerApplications' },

  { section: 'Professionnels', name: 'Agents', href: '/agents', icon: RiBriefcaseLine, claims: ['admin', 'manager'], module: 'agents', badgeKey: 'pendingAgents' },
  { section: 'Professionnels', name: 'Artisans', href: '/workers', icon: RiHammerLine, claims: ['admin', 'manager'], module: 'workers', badgeKey: 'pendingWorkers' },

  { section: 'Biens & produits', name: 'Gestion locative', href: '/gestion-locative', icon: RiBuildingLine, claims: ['admin', 'manager'], module: 'properties' },
  { section: 'Biens & produits', name: 'Marketplace', href: '/marketplace', icon: RiShoppingBag3Line, claims: ['admin', 'manager'], module: 'marketplace' },

  { section: 'Site', name: 'Publicité', href: '/advertising', icon: RiBookOpenLine, claims: ['admin', 'manager'], module: 'advertising' },
  { section: 'Site', name: 'Partenaires', href: '/partners', icon: RiTeamLine, claims: ['admin', 'manager'], module: 'partners' },

  { section: 'Administration', name: 'Utilisateurs', href: '/users', icon: RiGroupLine, claims: ['admin'] },
  { section: 'Administration', name: 'Paramètres', href: '/settings', icon: RiSettings3Line, claims: ['admin'] },
]

/** Entrée active aussi sur ses pages de détail (/agents/123 → « Agents »). */
const isActivePath = (currentPath, href) =>
  href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`)

/** Menu par sections, avec le nombre d'éléments en attente. */
function NavSections({ items, currentPath, onNavigate }) {
  const counts = useNotifications()
  let lastSection
  return items.map((item) => {
    const heading = item.section && item.section !== lastSection ? item.section : null
    lastSection = item.section
    const isActive = isActivePath(currentPath, item.href)
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
          className={`nav-item-inactive flex min-h-11 items-center gap-3 rounded-md px-3.5 py-2 ${item.href === '/' ? 'mb-2' : ''} ${isActive ? 'nav-item-active' : ''}`}
          onClick={onNavigate}>
          <item.icon className="h-[17px] w-[17px] flex-shrink-0" />
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
                style={{ backgroundColor: colors.navyDark }}
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
                  <div className="absolute top-0 right-0 -mr-11 pt-2">
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
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <span className="text-sm font-black text-white">B</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight leading-none text-white">
                      BâtiMoo
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: SIDEBAR_TEXT }}>
                      Tableau de bord
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
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
                style={{ backgroundColor: colors.primary }}
              >
                <span className="text-sm font-black text-white">B</span>
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight leading-none text-white">
                  BâtiMoo
                </p>

                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: SIDEBAR_TEXT }}>
                  Tableau de bord
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
            className="sticky top-0 z-10 flex h-14 items-center border-b px-3 md:hidden"
            style={{ backgroundColor: colors.white, borderColor: colors.gray100 }}
          >
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Ouvrir menu</span>
              <RiMenuLine className="h-5 w-5" aria-hidden="true" />
            </button>
            <p className="ml-2 text-sm font-bold" style={{ color: colors.gray900 }}>
              BâtiMoo Admin
            </p>
          </div>

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
