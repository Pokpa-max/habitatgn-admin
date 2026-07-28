import { useColors } from '@/contexts/ColorContext'

function Zone({ id, highlight, colors, className, children }) {
  const isActive = id === highlight
  return (
    <div
      className={`flex items-center justify-center rounded-sm border text-[10px] font-semibold ${className}`}
      style={
        isActive
          ? { backgroundColor: `${colors.primary}22`, borderColor: colors.primary, color: colors.primary }
          : { backgroundColor: colors.gray50, borderColor: colors.gray200, color: colors.gray300 }
      }
    >
      {children}
    </div>
  )
}

export default function PagePreview({ highlight, caption }) {
  const colors = useColors()

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mx-auto max-w-xs overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        {/* Barre navigateur */}
        <div className="flex items-center gap-1 border-b border-gray-100 bg-gray-50 px-2 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        </div>

        <div className="space-y-1 p-2">
          <Zone id="top-banner" highlight={highlight} colors={colors} className="h-3">
            {highlight === 'top-banner' ? 'Bannière' : ''}
          </Zone>
          <Zone id="header" highlight={highlight} colors={colors} className="h-3" />
          <Zone id="hero" highlight={highlight} colors={colors} className="h-12">
            {highlight === 'hero' ? 'Héro' : ''}
          </Zone>
          <Zone id="content" highlight={highlight} colors={colors} className="h-6" />
          <Zone id="mid-section" highlight={highlight} colors={colors} className="h-6">
            {highlight === 'mid-section' ? 'Agences' : ''}
          </Zone>
          <Zone id="content2" highlight={highlight} colors={colors} className="h-6" />
          <Zone id="footer" highlight={highlight} colors={colors} className="h-3" />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-gray-500">{caption}</p>
    </div>
  )
}
