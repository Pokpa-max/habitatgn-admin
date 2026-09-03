import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RiPieChartLine, RiHome4Line, RiHome3Line, RiCheckboxCircleLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import { getManagedProperties, getPropertiesByOwner } from '@/lib/services/managedProperties'
import { getLeases } from '@/lib/services/leases'

const STATUS_LABELS = { vacant: 'Vacant', occupied: 'Occupé', inactive: 'Inactif' }
const STATUS_COLORS = { vacant: '#F59E0B', occupied: '#16A34A', inactive: '#9CA3AF' }

export default function OccupationTab({ ownerId }) {
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
  const [leases, setLeases] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [propertiesData, leasesData] = await Promise.all([
          ownerId ? getPropertiesByOwner(ownerId) : getManagedProperties(),
          getLeases(),
        ])
        const propertyIds = new Set(propertiesData.map((p) => p.id))
        setProperties(propertiesData)
        setLeases(ownerId ? leasesData.filter((l) => propertyIds.has(l.propertyId)) : leasesData)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [ownerId])

  const total = properties.length
  const occupied = properties.filter((p) => p.status === 'occupied').length
  const vacant = properties.filter((p) => p.status === 'vacant').length
  const inactive = properties.filter((p) => p.status === 'inactive').length
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0

  const chartData = [
    { name: 'Occupé', count: occupied, status: 'occupied' },
    { name: 'Vacant', count: vacant, status: 'vacant' },
    { name: 'Inactif', count: inactive, status: 'inactive' },
  ]

  const activeLeaseByProperty = (propertyId) =>
    leases.find((l) => l.propertyId === propertyId && l.status === 'active')

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Occupation</h2>
        <p className="mt-1 text-sm text-gray-500">Taux d'occupation du parc de biens gérés</p>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader color="#111827" />
        </div>
      ) : total === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
          <RiPieChartLine className="h-6 w-6 text-gray-300" />
          <p className="text-sm text-gray-400">Aucun bien à analyser</p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              icon={RiHome4Line}
              label="Biens gérés"
              value={total}
              iconBg={colors.primaryVeryLight}
              iconColor={colors.primary}
            />
            <StatCard
              icon={RiPieChartLine}
              label="Taux d'occupation"
              value={`${occupancyRate}%`}
              iconBg="#F0FDF4"
              iconColor="#065F46"
            />
            <StatCard
              icon={RiCheckboxCircleLine}
              label="Occupés"
              value={occupied}
              iconBg="#F0FDF4"
              iconColor={colors.success}
            />
            <StatCard
              icon={RiHome3Line}
              label="Vacants"
              value={vacant}
              iconBg="#FFFBEB"
              iconColor="#92400E"
            />
          </div>

          <div className="mb-6 h-64 rounded-lg border border-gray-100 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Détail par bien</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4">Bien</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4">Locataire actuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((property) => {
                  const lease = activeLeaseByProperty(property.id)
                  return (
                    <tr key={property.id}>
                      <td className="py-3 pr-4 text-gray-700">
                        {property.reference} — {property.address}
                        {property.unitLabel ? ` (${property.unitLabel})` : ''}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: `${STATUS_COLORS[property.status]}22`,
                            color: STATUS_COLORS[property.status],
                          }}
                        >
                          {STATUS_LABELS[property.status] || property.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{lease ? lease.tenantName : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
