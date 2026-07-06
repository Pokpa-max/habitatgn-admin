import { useState } from 'react'
import { RiTeamLine, RiScalesLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import PartnerAgenciesTab from './PartnerAgenciesTab'
import LegalPartnersTab from './LegalPartnersTab'

const SECTIONS = [
  { value: 'agencies', label: 'Agences', icon: RiTeamLine },
  { value: 'legal', label: 'Légaux', icon: RiScalesLine },
]

export default function PartnersTab() {
  const colors = useColors()
  const [activeSection, setActiveSection] = useState('agencies')

  return (
    <div>
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {SECTIONS.map((section) => {
          const active = activeSection === section.value
          return (
            <button
              key={section.value}
              onClick={() => setActiveSection(section.value)}
              className="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
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

      {activeSection === 'agencies' && <PartnerAgenciesTab />}
      {activeSection === 'legal' && <LegalPartnersTab />}
    </div>
  )
}
