import { useColors } from '@/contexts/ColorContext'

// Pastille de statut avec puce colorée — réplique exacte de la proposition
// de palette validée (.pill / .pill::before). Un seul composant partagé pour
// que tous les tableaux de l'admin affichent le même style, au lieu de
// chaque page réinventant sa propre pastille.
const TONE_FG = (colors) => ({
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  primary: colors.primary,
  gray: colors.gray600,
})

const TONE_BG = (colors) => ({
  success: '#EAF7EE',
  warning: '#FEF6E7',
  error: '#FDECEC',
  primary: colors.primaryVeryLight,
  gray: colors.gray100,
})

export default function StatusPill({ tone = 'gray', children }) {
  const colors = useColors()
  const fg = TONE_FG(colors)[tone] || colors.gray600
  const bg = TONE_BG(colors)[tone] || colors.gray100

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: bg, color: fg }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: fg }} />
      {children}
    </span>
  )
}
