import { useEffect, useState } from 'react'
import { RiMoneyDollarCircleLine, RiPercentLine, RiToolsLine, RiWallet3Line } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF, currentPeriod, formatPeriodLabel } from '@/utils/format'
import Loader from '@/components/Loader'
import { getManagedProperties, getPropertiesByOwner } from '@/lib/services/managedProperties'
import { getPaymentsByProperty } from '@/lib/services/rentPayments'
import { getPropertyExpenses } from '@/lib/services/propertyExpenses'
import { getMaintenanceTickets } from '@/lib/services/maintenanceTickets'
import { getPropertyOwners } from '@/lib/services/propertyOwners'

export default function ProprietaireTab({ ownerId, ownerName }) {
  const colors = useColors()

  const StatCard = ({ icon: Icon, label, value, iconBg, iconColor }) => (
    <div
      className="flex flex-col gap-2.5 rounded-xl p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ backgroundColor: colors.white, border: `1px solid ${colors.gray100}` }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <p className="text-xs font-semibold" style={{ color: colors.gray500 }}>
        {label}
      </p>
      <p className="font-mono text-xl font-semibold tracking-tight" style={{ color: colors.gray900 }}>
        {value}
      </p>
    </div>
  )
  const [properties, setProperties] = useState([])
  const [owners, setOwners] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [propertyId, setPropertyId] = useState('')
  const [period, setPeriod] = useState(currentPeriod())
  const [statement, setStatement] = useState(null)
  const [computing, setComputing] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [data, ownersData] = await Promise.all([
          ownerId ? getPropertiesByOwner(ownerId) : getManagedProperties(),
          ownerId ? Promise.resolve([]) : getPropertyOwners(),
        ])
        setProperties(data)
        setOwners(ownersData)
        if (data.length > 0) setPropertyId(data[0].id)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [ownerId])

  useEffect(() => {
    if (!propertyId) return
    const compute = async () => {
      setComputing(true)
      try {
        const property = properties.find((p) => p.id === propertyId)
        const [payments, expenses, tickets] = await Promise.all([
          getPaymentsByProperty(propertyId),
          getPropertyExpenses(),
          getMaintenanceTickets(),
        ])

        const rentCollected = payments
          .filter((p) => p.period === period)
          .reduce((sum, p) => sum + (p.amountPaid || 0), 0)

        const commissionRate = property?.commissionRate || 0
        const commission = rentCollected * (commissionRate / 100)

        const periodExpenses = expenses.filter((e) => e.propertyId === propertyId && e.period === period)
        const expensesTotal = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)

        const periodMaintenance = tickets.filter(
          (t) =>
            t.propertyId === propertyId &&
            t.status === 'résolu' &&
            t.resolvedDate &&
            t.resolvedDate.slice(0, 7) === period
        )
        const maintenanceTotal = periodMaintenance.reduce((sum, t) => sum + (t.cost || 0), 0)

        const netToOwner = rentCollected - commission - expensesTotal - maintenanceTotal

        setStatement({
          property,
          rentCollected,
          commission,
          expensesTotal,
          maintenanceTotal,
          netToOwner,
          expenseLines: periodExpenses,
          maintenanceLines: periodMaintenance,
        })
      } catch (e) {
        notify('Erreur lors du calcul', 'error')
      }
      setComputing(false)
    }
    compute()
  }, [propertyId, period, properties])

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Transactions du mois — Propriétaire</h2>
          <p className="mt-1 text-sm text-gray-500">Revenu net dû au propriétaire après commission et dépenses</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="rounded-xl border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.reference} — {p.address}
                {p.unitLabel ? ` (${p.unitLabel})` : ''}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader color="#111827" />
        </div>
      ) : properties.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
          <RiMoneyDollarCircleLine className="h-6 w-6 text-gray-300" />
          <p className="text-sm text-gray-400">Ajoutez d'abord un bien pour voir son état mensuel</p>
        </div>
      ) : computing || !statement ? (
        <div className="flex h-32 items-center justify-center">
          <Loader color="#111827" />
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            {ownerName || owners.find((o) => o.id === statement.property?.ownerId)?.name || 'Propriétaire inconnu'}
            {' · '}
            {formatPeriodLabel(period)}
          </p>

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={RiMoneyDollarCircleLine}
              label="Loyers encaissés"
              value={formatGNF(statement.rentCollected)}
              iconBg={colors.primaryVeryLight}
              iconColor={colors.primary}
            />
            <StatCard
              icon={RiPercentLine}
              label="Commission agence"
              value={formatGNF(statement.commission)}
              iconBg="#FFFBEB"
              iconColor="#92400E"
            />
            <StatCard
              icon={RiToolsLine}
              label="Dépenses & entretien"
              value={formatGNF(statement.expensesTotal + statement.maintenanceTotal)}
              iconBg="#FEF2F2"
              iconColor="#991B1B"
            />
            <StatCard
              icon={RiWallet3Line}
              label="Net à reverser"
              value={formatGNF(statement.netToOwner)}
              iconBg={statement.netToOwner >= 0 ? '#F0FDF4' : '#FEF2F2'}
              iconColor={statement.netToOwner >= 0 ? '#065F46' : '#991B1B'}
            />
          </div>

          {(statement.expenseLines.length > 0 || statement.maintenanceLines.length > 0) && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Détail des charges</p>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                {statement.expenseLines.map((e) => (
                  <div key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-700">{e.label}</span>
                    <span className="font-semibold text-gray-900">{formatGNF(e.amount)}</span>
                  </div>
                ))}
                {statement.maintenanceLines.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-gray-700">Entretien — {t.title}</span>
                    <span className="font-semibold text-gray-900">{formatGNF(t.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
