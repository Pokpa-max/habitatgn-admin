import { useState } from 'react'
import { RiTruckLine, RiHomeGearLine, RiFileShieldLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import PricingPackagesTab from './PricingPackagesTab'

const SECTIONS = [
  { value: 'moving', label: 'Déménagement', icon: RiTruckLine },
  { value: 'rental', label: 'Gestion locative', icon: RiHomeGearLine },
  { value: 'legal', label: 'Sécurisation foncière', icon: RiFileShieldLine },
]

export default function ServicePricingTab() {
  const colors = useColors()
  const [activeSection, setActiveSection] = useState('moving')

  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
        {SECTIONS.map((section) => {
          const active = activeSection === section.value
          return (
            <button
              key={section.value}
              onClick={() => setActiveSection(section.value)}
              className="flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
              style={
                active
                  ? { borderColor: colors.primary, color: colors.primary }
                  : { borderColor: 'transparent', color: colors.gray500 }
              }
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </button>
          )
        })}
      </div>

      {activeSection === 'moving' && (
        <PricingPackagesTab
          collectionName="movingPackages"
          title="Tarifs — Déménagement"
          description="Offres proposées sur le formulaire de déménagement du site public"
        />
      )}
      {activeSection === 'rental' && (
        <PricingPackagesTab
          collectionName="rentalPackages"
          title="Tarifs — Gestion locative"
          description="Offres proposées sur le formulaire de gestion locative du site public"
          priceLabel="Pourcentage (%)"
          priceSuffix="%"
          showPriceDisplay
        />
      )}
      {activeSection === 'legal' && (
        <PricingPackagesTab
          collectionName="verificationPackages"
          title="Tarifs — Sécurisation foncière"
          description="Offres proposées sur le formulaire de sécurisation foncière du site public"
          showDelayDays
        />
      )}
    </div>
  )
}
