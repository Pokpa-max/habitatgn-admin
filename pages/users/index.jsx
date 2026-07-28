import { useEffect, useState } from 'react'
import { RiGroupLine, RiProfileLine, RiShieldStarLine } from 'react-icons/ri'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import { collection, getDocs, query, where } from 'firebase/firestore'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import { useColors } from '@/contexts/ColorContext'
import { db } from '@/lib/firebase/client_config'
import CustomersPage from '@/components/Users/Customers/CustomersPage'
import ManagersPage from '@/components/Users/Managers/ManagersPage'

const TABS = [
  { value: 'customers', label: 'Utilisateurs', icon: RiGroupLine, type: 'customer' },
  { value: 'managers', label: 'Managers', icon: RiProfileLine, type: 'manager' },
  { value: 'admins', label: 'Admins', icon: RiShieldStarLine, type: 'admin' },
]

function Users() {
  const colors = useColors()
  const [activeTab, setActiveTab] = useState('customers')
  const [counts, setCounts] = useState({})

  useEffect(() => {
    const loadCounts = async () => {
      const usersRef = collection(db, 'users')
      const results = await Promise.all(
        TABS.map((tab) => getDocs(query(usersRef, where('type', '==', tab.type))))
      )
      const next = {}
      TABS.forEach((tab, i) => {
        next[tab.value] = results[i].size
      })
      setCounts(next)
    }
    loadCounts()
  }, [])

  return (
    <Scaffold>
      <Header title="Utilisateurs" />

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {TABS.map((tab) => {
          const active = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
              style={
                active
                  ? { borderColor: colors.primary, color: colors.primary }
                  : { borderColor: 'transparent', color: colors.gray500 }
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {counts[tab.value] !== undefined && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs"
                  style={
                    active
                      ? { backgroundColor: colors.primaryVeryLight, color: colors.primary }
                      : { backgroundColor: colors.gray100, color: colors.gray500 }
                  }
                >
                  {counts[tab.value]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'customers' && <CustomersPage />}
      {activeTab === 'managers' && <ManagersPage types={['manager']} title="Managers" />}
      {activeTab === 'admins' && <ManagersPage types={['admin']} title="Admins" />}
    </Scaffold>
  )
}

const UsersPage = () => (
  <Page name="Utilisateurs | BâtiServices Admin">
    <Users />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (AuthUser.claims.userType !== 'admin') {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(UsersPage)
