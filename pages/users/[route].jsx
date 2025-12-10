import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { RiGroupFill, RiProfileLine } from 'react-icons/ri'

import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'

import Link from 'next/link'
import ManagersPage from '../../components/Users/Managers/ManagersPage'
import CustomersPage from '../../components/Users/Customers/CustomersPage'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Users() {
  const router = useRouter()
  const currentPath = router.query.route

  const subNavigation = [
    {
      name: 'Utlisateurs',
      href: `customers`,
      icon: RiGroupFill,
      current: currentPath === `customers`,
      component: <CustomersPage />,
    },
    {
      name: 'Managers',
      href: `managers`,
      icon: RiProfileLine,
      current: currentPath === `managers`,
      component: <ManagersPage />,
    },
  ]

  const findSlugMatchingCmp = () =>
    subNavigation.find((link) => link.href === currentPath)

  useEffect(() => {
    const foundComponent = findSlugMatchingCmp()
    if (currentPath && !foundComponent) router.push('/404')
  }, [router])

  const cmp = findSlugMatchingCmp()?.component

  return (
    <Scaffold
      subNav={
        <main className="relative h-screen ">
          <div className="h-screen bg-white ">
            <div className="h-screen divide-y divide-gray-200 lg:grid lg:grid-cols-12 lg:divide-y-0 lg:divide-x">
              <aside className="py-6 lg:col-span-2">
                <nav className="space-y-1">
                  {subNavigation.map((item) => (
                    <Link passHref key={item.name} href={item.href}>
                      <a
                        className={classNames(
                          item.current
                            ? 'bg-cyan-500 text-white'
                            : 'text-gray-500 hover:bg-cyan-500 hover:text-white',
                          'group flex items-center px-2 py-3 text-sm font-medium hover:cursor-pointer'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            item.current
                              ? 'text-white'
                              : 'text-gray-500 group-hover:text-white',
                            'mr-3 h-7 w-7 flex-shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.name}</span>
                      </a>
                    </Link>
                  ))}
                </nav>
              </aside>
              <div className="divide-y divide-gray-200 lg:col-span-10">
                {cmp}
              </div>
            </div>
          </div>
        </main>
      }
      title={'Users'}
    />
  )
}

const UsersPage = () => (
  <Page name="Users | ConaLoge">
    <Users />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (AuthUser.claims.userType !== 'admin') {
    return {
      notFound: true,
    }
  }
  return {
    props: {},
  }
})
export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(UsersPage)
