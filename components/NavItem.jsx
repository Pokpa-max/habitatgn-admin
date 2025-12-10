import React from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function NavItem({ item }) {
  const { pathname } = useRouter()
  const active = pathname === item.href

  return (
    <Link passHref key={item.name} href={item.href}>
      <a
        className={classNames(
          active
            ? 'bg-cyan-500 text-white'
            : 'text-gray-500 hover:bg-cyan-500 hover:text-white',
          'group flex items-center px-2 py-3 text-sm font-medium hover:cursor-pointer'
        )}
      >
        <item.icon
          className={classNames(
            active ? 'text-white' : 'text-gray-500 group-hover:text-white',
            'mr-3 h-7 w-7 flex-shrink-0'
          )}
          aria-hidden="true"
        />
        {item.name}
      </a>
    </Link>
  )
}

export default NavItem
