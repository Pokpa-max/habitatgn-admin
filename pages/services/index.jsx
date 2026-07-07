import { useState } from 'react'
import { RiTruckLine, RiHomeGearLine, RiFileShieldLine } from 'react-icons/ri'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import { useColors } from '@/contexts/ColorContext'
import MovingTab from '@/components/services/MovingTab'
import RentalManagementTab from '@/components/services/RentalManagementTab'
import LegalSecurityTab from '@/components/services/LegalSecurityTab'

const TABS = [
  { value: 'moving', label: 'Déménagement', icon: RiTruckLine },
  { value: 'rental', label: 'Gestion locative', icon: RiHomeGearLine },
  { value: 'legal', label: 'Sécurisation foncière', icon: RiFileShieldLine },
]

function Services() {
  const colors = useColors()
  const [activeTab, setActiveTab] = useState('moving')

  return (
    <Scaffold>
      <Header title="Services" />

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
        {TABS.map((tab) => {
          const active = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
              style={
                active
                  ? { borderColor: colors.primary, color: colors.primary }
                  : { borderColor: 'transparent', color: colors.gray500 }
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'moving' && <MovingTab />}
      {activeTab === 'rental' && <RentalManagementTab />}
      {activeTab === 'legal' && <LegalSecurityTab />}
    </Scaffold>
  )
}

const ServicesPage = () => (
  <Page name="Services | HabitatGN">
    <Services />
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
})(ServicesPage)
