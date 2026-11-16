import { useState } from 'react'
import {
  RiHomeGearLine,
  RiMoneyDollarCircleLine,
  RiToolsLine,
} from 'react-icons/ri'
import {
  AuthAction,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import { useColors } from '@/contexts/ColorContext'
import { useNotifications } from '@/contexts/NotificationsContext'
import MovingTab from '@/components/services/MovingTab'
import RentalManagementTab from '@/components/services/RentalManagementTab'
import LegalSecurityTab from '@/components/services/LegalSecurityTab'
import PropertySearchTab from '@/components/services/PropertySearchTab'
import ArtisanRequestsTab from '@/components/services/ArtisanRequestsTab'
import ServiceRevenuesTab from '@/components/services/ServiceRevenuesTab'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Services() {
  const colors = useColors()
  const notifications = useNotifications()
  const [activeSection, setActiveSection] = useState('property')
  const [activePropertyCategory, setActivePropertyCategory] = useState('moving')

  const propertyCategories = [
    { value: 'moving', label: 'Déménagement', badgeCount: notifications.pendingMovingRequests },
    { value: 'rental', label: 'Gestion locative', badgeCount: notifications.pendingRentalRequests },
    { value: 'legal', label: 'Sécurisation foncière', badgeCount: notifications.pendingLegalRequests },
    { value: 'search', label: 'Recherche immobilière', badgeCount: notifications.pendingPropertySearchRequests },
  ]
  const propertyRequestsCount = propertyCategories.reduce((total, category) => total + category.badgeCount, 0)
  const sections = [
    { value: 'property', label: 'Demandes immobilières', icon: RiHomeGearLine, badgeCount: propertyRequestsCount },
    { value: 'artisan', label: 'Artisans / Autres demandes', icon: RiToolsLine, badgeCount: notifications.pendingArtisanRequests },
    { value: 'revenues', label: 'Revenus des services', icon: RiMoneyDollarCircleLine },
  ]
  const activeSectionLabel = sections.find((section) => section.value === activeSection)?.label

  return (
    <Scaffold>
      <Header title="Demandes de service" />

      <div
        role="group"
        aria-label="Rubriques des demandes"
        className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {sections.map((section) => {
          const active = activeSection === section.value
          return (
            <button
              key={section.value}
              type="button"
              aria-pressed={active}
              aria-controls="service-content"
              onClick={() => setActiveSection(section.value)}
              className="flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:px-4"
              style={
                active
                  ? { borderColor: colors.primary, backgroundColor: colors.primaryVeryLight, color: colors.primary }
                  : { borderColor: colors.gray200, backgroundColor: colors.white, color: colors.gray700 }
              }
            >
              <span className="flex min-w-0 items-center gap-2">
                <section.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{section.label}</span>
              </span>
              {section.badgeCount > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: colors.orangeAccent }}
                  aria-label={`${section.badgeCount} demandes en attente`}
                >
                  {section.badgeCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div id="service-content" role="region" aria-label={activeSectionLabel}>
        {activeSection === 'property' && (
          <>
            <div className="mb-5">
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Type de demande immobilière
              </p>
              <div
                role="group"
                aria-label="Type de demande immobilière"
                className="grid grid-cols-2 gap-2 lg:grid-cols-4"
              >
                {propertyCategories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    aria-pressed={activePropertyCategory === category.value}
                    aria-controls="service-content"
                    aria-label={`${category.label}, ${category.badgeCount} demande${category.badgeCount === 1 ? '' : 's'} en attente`}
                    onClick={() => setActivePropertyCategory(category.value)}
                    className="flex min-h-12 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                    style={
                      activePropertyCategory === category.value
                        ? { borderColor: colors.primary, backgroundColor: colors.primaryVeryLight, color: colors.primary }
                        : { borderColor: colors.gray200, backgroundColor: colors.white, color: colors.gray700 }
                    }
                  >
                    <span>{category.label}</span>
                    {category.badgeCount > 0 && (
                      <span
                        aria-hidden="true"
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{ backgroundColor: colors.orangeAccent }}
                      >
                        {category.badgeCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {activePropertyCategory === 'moving' && <MovingTab />}
            {activePropertyCategory === 'rental' && <RentalManagementTab />}
            {activePropertyCategory === 'legal' && <LegalSecurityTab />}
            {activePropertyCategory === 'search' && <PropertySearchTab />}
          </>
        )}
        {activeSection === 'artisan' && <ArtisanRequestsTab />}
        {activeSection === 'revenues' && <ServiceRevenuesTab />}
      </div>
    </Scaffold>
  )
}

const ServicesPage = () => (
  <Page name="Services | BâtiMoo Admin">
    <Services />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'services'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(ServicesPage)
