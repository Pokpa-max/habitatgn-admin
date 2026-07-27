import { useEffect, useState } from 'react'
import {
  RiMoneyDollarCircleLine,
  RiTruckLine,
  RiHomeGearLine,
  RiFileShieldLine,
  RiCalendarCheckLine,
  RiWallet3Line,
  RiCalendarEventLine,
  RiFilter3Line,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import { formatGNF } from '@/utils/format'
import { getMovingRequests } from '@/lib/services/movingRequests'
import { getRentalManagementRequests } from '@/lib/services/rentalManagementRequests'
import { getLegalSecurityRequests } from '@/lib/services/legalSecurityRequests'
import { getRentPayments } from '@/lib/services/rentPayments'
import { getManagedProperties } from '@/lib/services/managedProperties'

export default function ServiceRevenuesTab() {
  const colors = useColors()
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all') // 'week' | 'month' | 'year' | 'all'

  const emptyPeriod = { platform: 0, gross: 0 }
  const [periodTotals, setPeriodTotals] = useState({
    week: emptyPeriod,
    month: emptyPeriod,
    year: emptyPeriod,
    all: emptyPeriod,
  })

  const [stats, setStats] = useState({
    totalRevenue: 0,
    movingRevenue: 0,
    movingCount: 0,
    rentalRevenue: 0,
    rentalGross: 0,
    rentalCount: 0,
    legalRevenue: 0,
    legalCount: 0,
  })

  const [revenueItems, setRevenueItems] = useState([])

  const parseItemDate = (dateVal) => {
    if (!dateVal) return null
    if (dateVal?.seconds) return new Date(dateVal.seconds * 1000)
    if (dateVal instanceof Date) return dateVal
    return new Date(dateVal)
  }

  const isWithinPeriod = (itemDate, period) => {
    if (!itemDate || period === 'all') return true
    const date = parseItemDate(itemDate)
    if (!date || isNaN(date.getTime())) return false

    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (period === 'week') {
      return diffDays <= 7 || (date.getFullYear() === now.getFullYear() && getWeekNumber(date) === getWeekNumber(now))
    }
    if (period === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }
    if (period === 'year') {
      return date.getFullYear() === now.getFullYear()
    }
    return true
  }

  const getWeekNumber = (d) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    return Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
  }

  useEffect(() => {
    const loadRevenues = async () => {
      setIsLoading(true)
      try {
        const [moving, rental, legal, payments, properties] = await Promise.all([
          getMovingRequests(),
          getRentalManagementRequests(),
          getLegalSecurityRequests(),
          getRentPayments(),
          getManagedProperties(),
        ])
        const propertiesById = Object.fromEntries(properties.map((p) => [p.id, p]))

        // Calculs Déménagement
        let movingRev = 0
        let movingDoneCount = 0
        const movingItems = moving.map((r) => {
          const amount = Number(r.price || r.estimatedPrice || r.amount || 0)
          if (r.status === 'done' || r.status === 'completed') {
            movingRev += amount
            movingDoneCount++
          }
          return {
            id: `moving-${r.id}`,
            service: 'Déménagement',
            serviceType: 'moving',
            client: r.name || 'Client',
            phone: r.phone || '—',
            amount: amount,
            grossAmount: amount,
            status: r.status === 'done' ? 'Payé' : 'En attente',
            date: r.createdAt,
          }
        })

        // Calculs Gestion locative : seule la commission de l'agence (pas le loyer reversé au propriétaire) compte comme revenu plateforme
        let rentalRev = 0
        let rentalGross = 0
        let rentalDoneCount = payments.length
        const rentalItems = payments.map((p) => {
          const property = propertiesById[p.propertyId]
          const commissionRate = property?.commissionRate || 0
          const grossAmount = Number(p.amountPaid || p.amount || 0)
          const commission = grossAmount * (commissionRate / 100)
          rentalRev += commission
          rentalGross += grossAmount
          return {
            id: `rental-${p.id}`,
            service: 'Gestion locative (Loyer)',
            serviceType: 'rental',
            client: p.tenantName || p.name || 'Locataire',
            phone: p.phone || '—',
            amount: commission,
            grossAmount,
            commissionRate,
            status: 'Payé',
            date: p.createdAt || p.paymentDate,
          }
        })

        rental.forEach((r) => {
          const amount = Number(r.amount || r.fee || 0)
          if (r.status === 'done') {
            rentalRev += amount
            rentalGross += amount
            rentalDoneCount++
          }
          if (amount > 0) {
            rentalItems.push({
              id: `rental-req-${r.id}`,
              service: 'Gestion locative',
              serviceType: 'rental',
              client: r.name || 'Client',
              phone: r.phone || '—',
              amount: amount,
              grossAmount: amount,
              status: r.status === 'done' ? 'Payé' : 'En attente',
              date: r.createdAt,
            })
          }
        })

        // Calculs Sécurisation Foncière
        let legalRev = 0
        let legalDoneCount = 0
        const legalItems = legal.map((r) => {
          const amount = Number(r.price || r.fee || r.amount || 0)
          if (r.status === 'done') {
            legalRev += amount
            legalDoneCount++
          }
          return {
            id: `legal-${r.id}`,
            service: 'Sécurisation foncière',
            serviceType: 'legal',
            client: r.name || 'Client',
            phone: r.phone || '—',
            amount: amount,
            grossAmount: amount,
            status: r.status === 'done' ? 'Payé' : 'En attente',
            date: r.createdAt,
          }
        })

        const allItems = [...movingItems, ...rentalItems, ...legalItems].sort(
          (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
        )

        // Calcul des totaux par période (revenu plateforme vs total encaissé)
        let week = { platform: 0, gross: 0 }
        let month = { platform: 0, gross: 0 }
        let year = { platform: 0, gross: 0 }
        let all = { platform: 0, gross: 0 }

        allItems.forEach((item) => {
          const platformAmt = item.amount || 0
          const grossAmt = item.grossAmount ?? platformAmt
          all.platform += platformAmt
          all.gross += grossAmt
          if (isWithinPeriod(item.date, 'week')) {
            week.platform += platformAmt
            week.gross += grossAmt
          }
          if (isWithinPeriod(item.date, 'month')) {
            month.platform += platformAmt
            month.gross += grossAmt
          }
          if (isWithinPeriod(item.date, 'year')) {
            year.platform += platformAmt
            year.gross += grossAmt
          }
        })

        setPeriodTotals({ week, month, year, all })

        setStats({
          totalRevenue: all.platform,
          movingRevenue: movingRev,
          movingCount: movingDoneCount,
          rentalRevenue: rentalRev,
          rentalGross,
          rentalCount: rentalDoneCount,
          legalRevenue: legalRev,
          legalCount: legalDoneCount,
        })

        setRevenueItems(allItems)
      } catch (e) {
        notify('Erreur lors du chargement des revenus', 'error')
      }
      setIsLoading(false)
    }

    loadRevenues()
  }, [])

  const filteredItems = revenueItems.filter((item) => {
    const matchService = activeFilter === 'all' || item.serviceType === activeFilter
    const matchPeriod = isWithinPeriod(item.date, periodFilter)
    return matchService && matchPeriod
  })

  return (
    <div className="space-y-6">
      {/* En-tête Récapitulatif Admin */}
      <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Revenus des Services (Réservé Admin)</h3>
          <p className="text-sm text-gray-500">
            Revenu réel de la plateforme (commissions et prestations, hors loyers reversés aux propriétaires) par semaine, par mois et par année
          </p>
        </div>

        {/* Sélecteur de période globale */}
        <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 p-1">
          {[
            { value: 'week', label: 'Cette Semaine' },
            { value: 'month', label: 'Ce Mois' },
            { value: 'year', label: 'Cette Année' },
            { value: 'all', label: 'Tout le temps' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodFilter(p.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                periodFilter === p.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader color="#111827" />
        </div>
      ) : (
        <>
          {/* Cartes de Synthèse par Période (Semaine, Mois, Année, Total) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Revenu Semaine</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <RiCalendarEventLine className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-emerald-900">
                {formatGNF(periodTotals.week.platform)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                7 derniers jours · {formatGNF(periodTotals.week.gross)} encaissé
              </p>
            </div>

            <div className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Revenu Mois</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: colors.primaryVeryLight }}>
                  <RiMoneyDollarCircleLine className="h-5 w-5" style={{ color: colors.primary }} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold" style={{ color: colors.gray900 }}>
                {formatGNF(periodTotals.month.platform)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Ce mois-ci · {formatGNF(periodTotals.month.gross)} encaissé
              </p>
            </div>

            <div className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Revenu Année</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                  <RiWallet3Line className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-blue-900">
                {formatGNF(periodTotals.year.platform)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Cette année · {formatGNF(periodTotals.year.gross)} encaissé
              </p>
            </div>

            <div className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Cumul Global</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                  <RiMoneyDollarCircleLine className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-extrabold text-amber-900">
                {formatGNF(periodTotals.all.platform)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Tout l'historique · {formatGNF(periodTotals.all.gross)} encaissé
              </p>
            </div>
          </div>

          {/* Répartition par Service */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <RiTruckLine className="h-5 w-5 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Déménagement</span>
              </div>
              <p className="mt-2 text-xl font-extrabold text-gray-900">{formatGNF(stats.movingRevenue)}</p>
              <p className="mt-0.5 text-xs text-gray-400">{stats.movingCount} prestations</p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <RiHomeGearLine className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Gestion Locative</span>
              </div>
              <p className="mt-2 text-xl font-extrabold text-gray-900">{formatGNF(stats.rentalRevenue)}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                Commission sur {stats.rentalCount} règlements · {formatGNF(stats.rentalGross)} encaissé
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <RiFileShieldLine className="h-5 w-5 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Sécurisation Foncière</span>
              </div>
              <p className="mt-2 text-xl font-extrabold text-gray-900">{formatGNF(stats.legalRevenue)}</p>
              <p className="mt-0.5 text-xs text-gray-400">{stats.legalCount} dossiers</p>
            </div>
          </div>

          {/* Tableau des transactions de services */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-base font-bold text-gray-900">Détail des Encaissements</h4>

              {/* Filtres par type de service */}
              <div className="flex items-center gap-2">
                <RiFilter3Line className="h-4 w-4 text-gray-400" />
                <div className="flex gap-1.5 rounded-lg bg-gray-100 p-1">
                  {[
                    { value: 'all', label: 'Tous' },
                    { value: 'moving', label: 'Déménagement' },
                    { value: 'rental', label: 'Gestion' },
                    { value: 'legal', label: 'Foncier' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setActiveFilter(f.value)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                        activeFilter === f.value
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
                <RiCalendarCheckLine className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">Aucun enregistrement trouvé pour cette période/service</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: colors.gray50 }}>
                      <tr>
                        {['Service', 'Client / Contact', 'Montant', 'Statut', 'Date'].map((h) => (
                          <th
                            key={h}
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-gray-900">{item.service}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-800">{item.client}</p>
                            <p className="text-xs text-gray-400">{item.phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-gray-900">
                              {formatGNF(item.amount)}
                            </span>
                            {item.grossAmount !== undefined && (
                              <p className="mt-0.5 text-[11px] text-gray-400">
                                {formatGNF(item.grossAmount)} encaissé · {item.commissionRate}% commission
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: item.status === 'Payé' ? colors.primaryVeryLight : colors.gray100,
                                color: item.status === 'Payé' ? colors.primaryDark : colors.gray600,
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: item.status === 'Payé' ? colors.primary : colors.gray500 }}
                              />
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {item.date ? new Date(item.date?.seconds ? item.date.seconds * 1000 : item.date).toLocaleDateString('fr-FR') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
