import { Fragment, useState } from 'react'
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
} from 'react-icons/ri'
import Link from 'next/link'
import { useAuthUser } from 'next-firebase-auth'
import { useColors } from '../contexts/ColorContext'
import { useNotifications } from '../contexts/NotificationsContext'
import { useRouter } from 'next/router'

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
    claims: ['admin'],
  },
  {
    name: 'Publicité',
    href: '/advertising',
    icon: RiBookOpenLine,
    claims: ['admin'],
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
    badgeKey: 'pendingAgents',
  },
  {
    name: 'Gestion locative',
    href: '/gestion-locative',
    icon: RiBuildingLine,
    claims: ['admin', 'manager'],
  },
  {
    name: 'Réservations',
    href: '/reservations',
    icon: RiCalendarCheckLine,
    claims: ['admin', 'manager'],
    badgeKey: 'pendingBookings',
  },
  {
    name: 'Ouvriers',
    href: '/workers',
    icon: RiHammerLine,
    claims: ['admin', 'manager'],
    badgeKey: 'pendingWorkers',
  },
  {
    name: 'Partenaires',
    href: '/partners',
    icon: RiTeamLine,
    claims: ['admin'],
  },
  {
    name: 'Services',
    href: '/services',
    icon: RiTruckLine,
    claims: ['admin', 'manager'],
    badgeKey: 'pendingServiceRequests',
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: RiMailLine,
    claims: ['admin', 'manager'],
    badgeKey: 'unreadMessages',
  },
  {
    name: 'Paramètres',
    href: '/settings',
    icon: RiSettings3Line,
    claims: ['admin'],
  },
]

export default function Scaffold({ children, title, subNav }) {
  const colors = useColors()
  const notifications = useNotifications()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const AuthUser = useAuthUser()
  const router = useRouter()

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
          color: ${colors.primary};
          background-color: ${colors.primaryVeryLight};
          font-weight: 600;
          border-left: 3px solid ${colors.primary};
          box-shadow: 0 1px 2px 0 rgba(10, 77, 156, 0.08);
        }

        .nav-item-inactive {
          color: ${colors.gray600};
          transition: all 0.15s ease-in-out;
        }

        .nav-item-inactive:hover {
          color: ${colors.primaryHover};
          background-color: ${colors.gray50};
        }

        .logout-btn {
          color: ${colors.gray500};
          transition: color 0.15s ease;
        }

        .logout-btn:hover {
          color: ${colors.error};
        }
      `}</style>

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
                style={{ backgroundColor: colors.white }}
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
                  style={{ borderColor: colors.gray100 }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <span className="text-sm font-black text-white">B</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-tight leading-none" style={{ color: colors.gray900 }}>
                      BâtiMoo
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: colors.primary }}>
                      Tableau de bord
                    </p>
                  </div>
                </div>

                {/* Navigation Mobile */}
                <div className="h-0 flex-1 overflow-y-auto py-4">
                  <nav className="space-y-0.5 px-2">
                    {navigation.map((item) => {
                      if (item.claims.includes(AuthUser.claims?.userType)) {
                        const isActive = currentPath === item.href
                        const badgeCount = item.badgeKey ? notifications[item.badgeKey] : 0
                        return (
                          <Link key={item.name} href={item.href}>
                            <a
                              className={`nav-item-inactive flex items-center gap-3 rounded-md px-4 py-2.5 ${
                                isActive ? 'nav-item-active' : ''
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                              <span className="text-sm">{item.name}</span>
                              {badgeCount > 0 && (
                                <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  {badgeCount}
                                </span>
                              )}
                            </a>
                          </Link>
                        )
                      }
                      return null
                    })}
                  </nav>
                </div>

                {/* User Mobile */}
                <div className="flex flex-shrink-0 border-t p-4" style={{ borderColor: colors.gray100 }}>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: colors.gray900 }}>
                      {AuthUser?.displayName || 'Utilisateur'}
                    </p>
                    <p className="text-xs" style={{ color: colors.gray500 }}>
                      {AuthUser.claims?.userType === 'admin' ? 'Administrateur' : 'Manager'}
                    </p>
                  </div>
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
            style={{ backgroundColor: colors.white, borderRight: `1px solid ${colors.gray100}` }}
          >
            {/* Logo Desktop */}
            <div
              className="flex h-16 flex-shrink-0 items-center border-b px-6 gap-2.5"
              style={{ borderColor: colors.gray100 }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
                style={{ backgroundColor: colors.primary }}
              >
                <span className="text-sm font-black text-white">B</span>
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight leading-none" style={{ color: colors.gray900 }}>
                  BâtiMoo
                </p>

                <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: colors.primary }}>
                  Tableau de bord
                </p>
              </div>
            </div>

            {/* Navigation Desktop */}
            <nav className="flex-1 space-y-0.5 px-3 py-4">
              {navigation.map((item) => {
                if (item.claims.includes(AuthUser.claims?.userType)) {
                  const isActive = currentPath === item.href
                  const badgeCount = item.badgeKey ? notifications[item.badgeKey] : 0
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={`nav-item-inactive flex items-center gap-3 rounded-md px-4 py-2.5 ${
                          isActive ? 'nav-item-active' : ''
                        }`}
                      >
                        <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                        <span className="text-sm">{item.name}</span>
                        {badgeCount > 0 && (
                          <span className="ml-auto rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {badgeCount}
                          </span>
                        )}
                      </a>
                    </Link>
                  )
                }
                return null
              })}
            </nav>

            {/* User Section Desktop */}
            <div className="flex flex-shrink-0 border-t p-4" style={{ borderColor: colors.gray100 }}>
              <div className="w-full">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm"
                    style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                  >
                    {(AuthUser?.displayName?.[0] || 'A').toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-semibold" style={{ color: colors.gray900 }}>
                      {AuthUser?.displayName || 'Utilisateur'}
                    </p>
                    <p className="text-xs" style={{ color: colors.gray500 }}>
                      {AuthUser.claims?.userType === 'admin' ? 'Administrateur' : 'Manager'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={AuthUser.signOut}
                  className="logout-btn mt-3 flex w-full items-center gap-2 text-xs font-medium"
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
