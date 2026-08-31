import { useState } from 'react'
import {
  RiTruckLine,
  RiHomeGearLine,
  RiFileShieldLine,
  RiMoneyDollarCircleLine,
  RiToolsLine,
} from 'react-icons/ri'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import { useColors } from '@/contexts/ColorContext'
import { useNotifications } from '@/contexts/NotificationsContext'
import MovingTab from '@/components/services/MovingTab'
import RentalManagementTab from '@/components/services/RentalManagementTab'
import LegalSecurityTab from '@/components/services/LegalSecurityTab'
import ArtisanRequestsTab from '@/components/services/ArtisanRequestsTab'
import ServiceRevenuesTab from '@/components/services/ServiceRevenuesTab'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Services() {
  const colors = useColors()
  const notifications = useNotifications()
  const [activeTab, setActiveTab] = useState('moving')

  const TABS = [
    { value: 'moving', label: 'Déménagement', icon: RiTruckLine, badgeCount: notifications.pendingMovingRequests },
    { value: 'rental', label: 'Gestion locative', icon: RiHomeGearLine, badgeCount: notifications.pendingRentalRequests },
    { value: 'legal', label: 'Sécurisation foncière', icon: RiFileShieldLine, badgeCount: notifications.pendingLegalRequests },
    { value: 'artisan', label: 'Artisans / Autres demandes', icon: RiToolsLine, badgeCount: notifications.pendingArtisanRequests },
    { value: 'revenues', label: 'Revenus des services', icon: RiMoneyDollarCircleLine },
  ]

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
              {tab.badgeCount > 0 && (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {tab.badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'moving' && <MovingTab />}
      {activeTab === 'rental' && <RentalManagementTab />}
      {activeTab === 'legal' && <LegalSecurityTab />}
      {activeTab === 'artisan' && <ArtisanRequestsTab />}
      {activeTab === 'revenues' && <ServiceRevenuesTab />}
    </Scaffold>
  )
}

const ServicesPage = () => (
  <Page name="Services | BâtiMoo Admin">
    <Services />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'services'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(ServicesPage)
