import { useState } from 'react'
import {
  RiImageLine,
  RiAdvertisementLine,
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
import HeroTab from '@/components/advertising/HeroTab'
import FeaturedAdTab from '@/components/advertising/FeaturedAdTab'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

const TABS = [
  { value: 'hero', label: 'Section héro', icon: RiImageLine },
  { value: 'featured-ad', label: 'Bannière vedette', icon: RiAdvertisementLine },
]

function Advertising() {
  const colors = useColors()
  const [activeTab, setActiveTab] = useState('hero')

  return (
    <Scaffold>
      <Header title="Publicité" />

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

      {activeTab === 'hero' && <HeroTab />}
      {activeTab === 'featured-ad' && <FeaturedAdTab />}
    </Scaffold>
  )
}

const AdvertisingPage = () => (
  <Page name="Publicité | BâtiMoo Admin">
    <Advertising />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'advertising'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(AdvertisingPage)
