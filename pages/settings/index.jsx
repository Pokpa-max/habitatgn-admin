import { useState } from 'react'
import { RiContactsLine, RiPriceTag3Line, RiHammerLine } from 'react-icons/ri'
import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import { useColors } from '@/contexts/ColorContext'
import ContactTab from '../../components/siteSettings/ContactTab'
import ServicePricingTab from '@/components/Settings/ServicePricingTab'
import WorkerSubscriptionTab from '@/components/Settings/WorkerSubscriptionTab'

const TABS = [
  { value: 'contact', label: 'Contact', icon: RiContactsLine },
  { value: 'pricing', label: 'Tarifs des services', icon: RiPriceTag3Line },
  { value: 'workers', label: 'Abonnement ouvriers', icon: RiHammerLine },
]

function Settings() {
  const colors = useColors()
  const [activeTab, setActiveTab] = useState('contact')

  return (
    <Scaffold>
      <Header title="Paramètres" />

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
            </button>
          )
        })}
      </div>

      {activeTab === 'contact' && <ContactTab />}
      {activeTab === 'pricing' && <ServicePricingTab />}
      {activeTab === 'workers' && <WorkerSubscriptionTab />}
    </Scaffold>
  )
}

const SettingsPage = () => (
  <Page name="Paramètres | BâtiServices Admin">
    <Settings />
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
})(SettingsPage)
