import { useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useColors } from '@/contexts/ColorContext'
import { formatGNF } from '@/utils/format'

const MONTHS_BACK = 6

const parseItemDate = (dateVal) => {
  if (!dateVal) return null
  if (dateVal?.seconds) return new Date(dateVal.seconds * 1000)
  if (dateVal instanceof Date) return dateVal
  const d = new Date(dateVal)
  return isNaN(d.getTime()) ? null : d
}

const CustomTooltip = ({ active, payload, label, colors }) => {
  if (!active || !payload?.length) return null
  const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]))
  return (
    <div
      className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-md"
      style={{ boxShadow: colors.shadow }}
    >
      <p className="text-xs font-semibold capitalize text-gray-500">{label}</p>
      <p className="text-sm font-bold" style={{ color: colors.primary }}>
        {formatGNF(byKey.revenue)}
      </p>
      <p className="text-xs text-gray-400">{byKey.count} paiement{byKey.count > 1 ? 's' : ''}</p>
    </div>
  )
}

export default function WorkerRevenueChart({ payments = [], isLoading }) {
  const colors = useColors()

  const { data, total } = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: MONTHS_BACK }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1 - i), 1)
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('fr-FR', { month: 'short' }),
        revenue: 0,
        count: 0,
      }
    })
    const byKey = Object.fromEntries(months.map((m) => [m.key, m]))

    payments.forEach((p) => {
      const date = parseItemDate(p.paidAt)
      if (!date) return
      const key = `${date.getFullYear()}-${date.getMonth()}`
      if (!byKey[key]) return
      byKey[key].revenue += Number(p.amount) || 0
      byKey[key].count += 1
    })

    return {
      data: months,
      total: months.reduce((sum, m) => sum + m.revenue, 0),
    }
  }, [payments])

  return (
    <div className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Revenu des abonnements ouvriers
          </p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: colors.gray900 }}>
            {formatGNF(total)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{MONTHS_BACK} derniers mois</p>
        </div>
      </div>

      <div className="mt-4 h-56">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Chargement...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="workerRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={colors.gray100} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: colors.gray400, textTransform: 'capitalize' }}
                dy={8}
              />
              <Tooltip content={<CustomTooltip colors={colors} />} cursor={{ stroke: colors.gray200 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={colors.primary}
                strokeWidth={2}
                fill="url(#workerRevenueFill)"
                dot={false}
                activeDot={{ r: 4, fill: colors.primary, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
