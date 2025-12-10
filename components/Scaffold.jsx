import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'

import {
  RiMenuFill,
  RiCloseFill,
  RiStore3Fill,
  RiGroupFill,
  RiBookOpenFill,
  RiDashboardFill,
} from 'react-icons/ri'

import NavItem from './NavItem'
import Link from 'next/link'
import { useAuthUser } from 'next-firebase-auth'

const navigation = [
  {
    name: 'Acceuil',
    href: '/',
    icon: RiDashboardFill,
    claims: ['admin', 'manager'],
  },
  {
    name: 'Publicité',
    href: '/advertising',
    icon: RiBookOpenFill,
    claims: ['admin'],
  },
  {
    name: 'Maisons',
    href: '/houses',
    icon: RiStore3Fill,
    claims: ['admin', 'manager'],
  },

  {
    name: 'Utilisateurs',
    href: '/users',
    icon: RiGroupFill,
    claims: ['admin'],
  },
]

export default function Scaffold({ children, title, subNav }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const AuthUser = useAuthUser()

  return (
    <>
      <div className="relative">
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
              <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
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
              <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
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
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <RiCloseFill
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="h-0 flex-1 overflow-y-auto pt-5 pb-4">
                  <div className="flex flex-shrink-0 items-center px-4">
                    <img
                      className="h-8 w-auto"
                      src="/images/logo.png"
                      alt="Eat224"
                    />
                  </div>
                  <nav className="mt-5 space-y-1 px-2">
                    {navigation.map((item) => {
                      if (item.claims.includes(AuthUser.claims.userType)) {
                        return <NavItem key={item.name} item={item} />
                      }

                      return null
                    })}
                  </nav>
                </div>
                <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
                  <a href="#" className="group block flex-shrink-0">
                    <div className="flex items-center">
                      <div>
                        <img
                          className="inline-block h-10 w-10 rounded-full"
                          src="https://pps.whatsapp.net/v/t61.24694-24/157381423_714662729958382_3255548508171682425_n.jpg?ccb=11-4&oh=66269bf17dc70b43bbcbd4949c6d81c9&oe=62B022BF"
                          alt=""
                        />
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </Transition.Child>
            <div className="w-14 flex-shrink-0"></div>
          </Dialog>
        </Transition.Root>

        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
          <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-4">
                <h1 className="ml-2 text-2xl">
                  <span className="font-extrabold ">ConaLoge</span>
                </h1>
              </div>
              <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
                {navigation.map((item) => {
                  if (item.claims.includes(AuthUser.claims.userType)) {
                    return <NavItem key={item.name} item={item} />
                  }

                  return null
                })}
              </nav>
            </div>
            <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
              <Link href={'/auth/signin'}>
                <a className="group block w-full flex-shrink-0">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {AuthUser?.displayName}
                      </p>
                      <button
                        onClick={AuthUser.signOut}
                        className="text-xs font-medium text-gray-500 group-hover:text-gray-700"
                      >
                        Se deconnecter
                      </button>
                    </div>
                  </div>
                </a>
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col md:pl-64">
          <div className="sticky top-0 z-10 bg-white pt-1 pl-1 sm:pl-3 sm:pt-3 md:hidden">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <RiMenuFill className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          {subNav ? (
            subNav
          ) : (
            <main className="flex-1">
              <div className="flex-1 py-6 ">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {title}
                  </h1>
                </div>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
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
