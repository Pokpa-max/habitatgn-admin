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
} from 'react-icons/ri'
import Link from 'next/link'
import { useAuthUser } from 'next-firebase-auth'
import { useColors } from '../contexts/ColorContext'
import { useRouter } from 'next/router'
import { db } from '../lib/firebase/client_config'
import { ALL_MANAGER_MODULE_KEYS } from '../lib/constants/managerModules'
import ChangePasswordModal from './ChangePasswordModal'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: RiDashboardLine,
    claims: ['admin', 'manager'],
  },
  {
    name: 'Marketplace',
    href: '/marketplace',
    icon: RiShoppingBag3Line,
    claims: ['admin', 'manager'],
    module: 'marketplace',
  },
  {
    name: 'Publicité',
    href: '/advertising',
    icon: RiBookOpenLine,
    claims: ['admin', 'manager'],
    module: 'advertising',
  },
  {
    name: 'Utilisateurs',
    href: '/users',
    icon: RiGroupLine,
    claims: ['admin'],
  },
  {
    name: 'Agents',
    href: '/agents',
    icon: RiBriefcaseLine,
    claims: ['admin', 'manager'],
    module: 'agents',
    badgeKey: 'pendingAgents',
  },
  {
    name: 'Gestion locative',
    href: '/gestion-locative',
    icon: RiBuildingLine,
    claims: ['admin', 'manager'],
    module: 'properties',
  },
  {
    name: 'Réservations',
    href: '/reservations',
    icon: RiCalendarCheckLine,
    claims: ['admin', 'manager'],
    module: 'reservations',
    badgeKey: 'pendingBookings',
  },
  {
    name: 'Ouvriers',
    href: '/workers',
    icon: RiHammerLine,
    claims: ['admin', 'manager'],
    module: 'workers',
    badgeKey: 'pendingWorkers',
  },
  {
    name: 'Partenaires',
    href: '/partners',
    icon: RiTeamLine,
    claims: ['admin', 'manager'],
    module: 'partners',
  },
  {
    name: 'Services',
    href: '/services',
    icon: RiTruckLine,
    claims: ['admin', 'manager'],
    module: 'services',
    badgeKey: 'pendingServiceRequests',
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: RiMailLine,
    claims: ['admin', 'manager'],
    module: 'messages',
    badgeKey: 'unreadMessages',
  },
  {
    name: 'Demandes de visite',
    href: '/leads',
    icon: RiCalendarTodoLine,
    claims: ['admin', 'manager'],
    module: 'leads',
    badgeKey: 'pendingLeads',
  },
  {
    name: 'Carrières',
    href: '/carrieres',
    icon: RiFileUserLine,
    claims: ['admin', 'manager'],
    module: 'careers',
    badgeKey: 'pendingCareerApplications',
  },
  {
    name: 'Paramètres',
    href: '/settings',
    icon: RiSettings3Line,
    claims: ['admin'],
  },
]

// Nuances dérivées du navy de la charte (colors.navyDark), utilisées
// uniquement pour le fond de la barre latérale — cf. proposition de palette
// admin validée (sidebar sombre pour faire ressortir primaire/orange).
const SIDEBAR_HOVER_BG = '#15263F'
const SIDEBAR_ACTIVE_BG = '#1E3252'
const SIDEBAR_TEXT = '#93A6C4'
const SIDEBAR_BORDER = '#1E3252'

export default function Scaffold({ children, title, subNav }) {
  const colors = useColors()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const AuthUser = useAuthUser()
  const router = useRouter()
  // Purement cosmétique (masque les items non autorisés) — la vraie barrière
  // est le check SSR par page (voir utils/firebase/checkManagerAccess.js).
  // null tant que non chargé = ne rien masquer, pour éviter un flash de nav
  // incomplète le temps de la lecture Firestore.
  const [managerPermissions, setManagerPermissions] = useState(null)

  useEffect(() => {
    if (AuthUser.claims?.userType !== 'manager' || !AuthUser.id) return
    let cancelled = false
    getDoc(doc(db, 'users', AuthUser.id))
      .then((snap) => {
        if (cancelled) return
        setManagerPermissions(snap.data()?.permissions || ALL_MANAGER_MODULE_KEYS)
      })
      .catch(() => {
        if (!cancelled) setManagerPermissions(ALL_MANAGER_MODULE_KEYS)
      })
    return () => {
      cancelled = true
    }
  }, [AuthUser.claims?.userType, AuthUser.id])

  const canSeeNavItem = (item) => {
    if (!item.claims.includes(AuthUser.claims?.userType)) return false
    if (AuthUser.claims?.userType !== 'manager' || !item.module) return true
    if (managerPermissions === null) return true
    return managerPermissions.includes(item.module)
  }

  const currentPath = router.pathname

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

        .nav-item-inactive {
          color: ${SIDEBAR_TEXT};
          border-left: 3px solid transparent;
          transition: all 0.15s ease-in-out;
        }

        .nav-item-inactive:hover {
          color: #FFFFFF;
          background-color: ${SIDEBAR_HOVER_BG};
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
                    {navigation.map((item) => {
                      if (canSeeNavItem(item)) {
                        const isActive = currentPath === item.href
                        return (
                          <Link key={item.name} href={item.href}>
                            <a
                              className={`nav-item-inactive flex items-center gap-3 rounded-md px-4 py-2.5 ${
                                isActive ? 'nav-item-active' : ''
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                              <span className="text-[13px]">{item.name}</span>
                            </a>
                          </Link>
                        )
                      }
                      return null
                    })}
                  </nav>
                </div>

                {/* User Mobile */}
                <div className="flex flex-shrink-0 flex-col border-t p-4" style={{ borderColor: SIDEBAR_BORDER }}>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {AuthUser?.displayName || 'Utilisateur'}
                    </p>
                    <p className="text-xs" style={{ color: SIDEBAR_TEXT }}>
                      {AuthUser.claims?.userType === 'admin' ? 'Administrateur' : 'Manager'}
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
                {navigation.map((item) => {
                  if (canSeeNavItem(item)) {
                    const isActive = currentPath === item.href
                    return (
                      <Link key={item.name} href={item.href}>
                        <a
                          className={`nav-item-inactive flex items-center gap-3 rounded-md px-4 py-2.5 ${
                            isActive ? 'nav-item-active' : ''
                          }`}
                        >
                          <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                          <span className="text-[13px]">{item.name}</span>
                        </a>
                      </Link>
                    )
                  }
                  return null
                })}
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
                      {AuthUser.claims?.userType === 'admin' ? 'Administrateur' : 'Manager'}
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
                  onClick={AuthUser.signOut}
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

          {/* Content */}
          {subNav ? (
            subNav
          ) : (
            <main className="flex-1">
              <div className="flex-1 py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                  <h1 className="text-2xl font-bold" style={{ color: colors.gray900 }}>
                    {title}
                  </h1>
                </div>
                <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 md:px-8">
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
