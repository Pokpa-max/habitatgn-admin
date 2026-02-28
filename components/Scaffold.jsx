import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  RiMenuFill,
  RiCloseFill,
  RiStore3Fill,
  RiGroupFill,
  RiBookOpenFill,
  RiDashboardFill,
  RiLogoutBoxRLine,
  RiSettings3Line,
  RiToolsLine,
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
    icon: RiDashboardFill,
    claims: ['admin', 'manager'],
  },
  {
    name: 'Biens immobiliers',
    href: '/houses',
    icon: RiStore3Fill,
    claims: ['admin', 'manager'],
  },
  {
    name: 'Location Journalière',
    href: '/daily-rentals',
    icon: RiStore3Fill,
    claims: ['admin', 'manager'],
  },
  {
    name: 'Terrains',
    href: '/lands',
    icon: RiStore3Fill,
    claims: ['admin', 'manager'],
  },
  {
    name: 'Publicité',
    href: '/advertising',
    icon: RiBookOpenFill,
    claims: ['admin'],
  },
  {
    name: 'Utilisateurs',
    href: '/users',
    icon: RiGroupFill,
    claims: ['admin'],
  },
  {
    name: 'Réservations',
    href: '/bookings',
    icon: RiCalendarCheckLine,
    claims: ['admin'],
    badgeKey: 'pendingBookings',
  },
  {
    name: 'Services',
    href: '/service-requests',
    icon: RiToolsLine,
    claims: ['admin'],
    badgeKey: 'pendingServices',
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

        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .sidebar-mobile {
          animation: slideInLeft 0.3s ease-out;
        }

        .nav-item-active {
          color: ${colors.primary};
          background-color: ${colors.primaryVeryLight};
          font-weight: 700;
          border-left: 4px solid ${colors.primary};
          padding-left: calc(1rem - 4px);
        }

        .nav-item-inactive {
          color: ${colors.gray600};
          transition: all 0.3s ease;
        }

        .nav-item-inactive:hover {
          color: ${colors.primary};
          background-color: ${colors.primaryVeryLight};
          padding-left: 1rem;
        }

        .sidebar-content {
          background: linear-gradient(180deg, ${colors.white} 0%, ${colors.gray50} 100%);
        }

        .logo-section {
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
          color: ${colors.white};
          animation: fadeIn 0.5s ease-out;
        }

        .user-section {
          transition: all 0.3s ease;
        }

        .user-section:hover {
          background-color: ${colors.gray50};
        }

        .logout-btn {
          color: ${colors.error};
          transition: all 0.3s ease;
        }

        .logout-btn:hover {
          background-color: #FEF2F2;
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
                style={{ backgroundColor: `rgba(0, 0, 0, 0.5)` }}
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
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: colors.primary }}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Fermer menu</span>
                      <RiCloseFill
                        className="h-6 w-6"
                        style={{ color: colors.white }}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>

                {/* Logo Mobile */}
                <div className="logo-section flex h-20 items-center rounded-b-2xl px-4">
                  <div>
                    <h1 className="text-2xl font-black">HabitatGN</h1>
                    <p className="text-xs font-semibold opacity-90">
                      {AuthUser.claims?.userType === 'admin'
                        ? 'Admin'
                        : 'Manager'}
                    </p>
                  </div>
                </div>

                {/* Navigation Mobile */}
                <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                  <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                      if (item.claims.includes(AuthUser.claims?.userType)) {
                        const isActive = currentPath === item.href
                        const badgeCount = item.badgeKey ? notifications[item.badgeKey] : 0
                        return (
                          <Link key={item.name} href={item.href}>
                            <a
                              className={`nav-item-inactive flex items-center gap-3 rounded-lg px-4 py-3 ${
                                isActive ? 'nav-item-active' : ''
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <item.icon className="h-5 w-5 flex-shrink-0" />
                              <span className="text-sm font-semibold">
                                {item.name}
                              </span>
                              {badgeCount > 0 && (
                                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
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
                <div
                  className="flex flex-shrink-0 border-t p-4"
                  style={{ borderColor: colors.gray200 }}
                >
                  <Link href="/auth/signin">
                    <a className="group block w-full flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className="text-sm font-bold"
                            style={{ color: colors.gray900 }}
                          >
                            {AuthUser?.displayName || 'Utilisateur'}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: colors.gray500 }}
                          >
                            {AuthUser.claims?.userType === 'admin'
                              ? 'Administrateur'
                              : 'Manager'}
                          </p>
                        </div>
                      </div>
                    </a>
                  </Link>
                </div>
              </div>
            </Transition.Child>

            <div className="w-14 flex-shrink-0" />
          </Dialog>
        </Transition.Root>

        {/* Desktop Sidebar */}
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
          <div
            className="sidebar-content flex min-h-0 flex-1 flex-col"
            style={{ borderRight: `1px solid ${colors.gray200}` }}
          >
            {/* Logo Desktop */}
            <div className="logo-section flex items-center gap-3 rounded-b-2xl px-6 py-6">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `rgba(255, 255, 255, 0.2)` }}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: colors.white }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2.423-1.053a7.477 7.477 0 0111.154 0l2.423 1.053M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1
                  className="text-xl font-black"
                  style={{ color: colors.white }}
                >
                  HabitatGN
                </h1>
                <p
                  className="text-xs font-semibold"
                  style={{ color: colors.white, opacity: 0.9 }}
                >
                  {AuthUser.claims?.userType === 'admin'
                    ? 'Portail Admin'
                    : 'Portail Manager'}
                </p>
              </div>
            </div>

            {/* Navigation Desktop */}
            <nav className="mt-6 flex-1 space-y-1 px-3">
              {navigation.map((item) => {
                if (item.claims.includes(AuthUser.claims?.userType)) {
                  const isActive = currentPath === item.href
                  const badgeCount = item.badgeKey ? notifications[item.badgeKey] : 0
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={`nav-item-inactive flex items-center gap-3 rounded-lg px-4 py-3 ${
                          isActive ? 'nav-item-active' : ''
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-semibold">
                          {item.name}
                        </span>
                        {badgeCount > 0 && (
                          <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
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
            <div
              className="flex flex-shrink-0 border-t p-4"
              style={{ borderColor: colors.gray200 }}
            >
              <div className="user-section w-full rounded-lg p-3">
                <p
                  className="text-sm font-bold"
                  style={{ color: colors.gray900 }}
                >
                  {AuthUser?.displayName || 'Utilisateur'}
                </p>
                <p className="text-xs" style={{ color: colors.gray500 }}>
                  {AuthUser.claims?.userType === 'admin'
                    ? 'Administrateur'
                    : 'Manager'}
                </p>
                <button
                  onClick={AuthUser.signOut}
                  className="logout-btn mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                >
                  <RiLogoutBoxRLine className="h-4 w-4" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col md:pl-64">
          {/* Top Bar Mobile */}
          <div
            className="sticky top-0 z-10 pt-1 pl-1 sm:pl-3 sm:pt-3 md:hidden"
            style={{ backgroundColor: colors.white }}
          >
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-lg transition-colors"
              style={{ color: colors.primary }}
              onClick={() => setSidebarOpen(true)}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = colors.primaryVeryLight)
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = 'transparent')
              }
            >
              <span className="sr-only">Ouvrir menu</span>
              <RiMenuFill className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          {subNav ? (
            subNav
          ) : (
            <main className="flex-1">
              <div className="flex-1 py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                  <h1
                    className="text-3xl font-black"
                    style={{ color: colors.gray900 }}
                  >
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
