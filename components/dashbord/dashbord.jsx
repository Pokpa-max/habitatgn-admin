import { db } from '@/lib/firebase/client_config'
import { useAuthUser } from 'next-firebase-auth'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { useColors } from '../../contexts/ColorContext'
import { useNotifications } from '../../contexts/NotificationsContext'
import { formatGNF } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import { getAllServiceRequests } from '@/lib/services/serviceRequests'
import { getRentPayments } from '@/lib/services/rentPayments'
import { getManagedProperties } from '@/lib/services/managedProperties'
import { getLeads } from '@/lib/services/leads'
import StatusPill from '@/components/ui/StatusPill'
import { RiPhoneLine, RiHome4Line, RiLandscapeLine, RiArrowRightLine } from 'react-icons/ri'
import {
  Briefcase,
  Hammer,
  Users,
  ShieldCheck,
  Scale,
  Building2,
  Home,
  CalendarCheck,
  Wallet,
} from 'lucide-react'

const LEAD_STATUS_META = {
  new: { label: 'Nouveau', tone: 'warning' },
  contacted: { label: 'Contacté', tone: 'primary' },
  closed: { label: 'Clôturé', tone: 'success' },
}

const MONTHS_BACK = 6

const parseItemDate = (dateVal) => {
  if (!dateVal) return null
  if (dateVal?.seconds) return new Date(dateVal.seconds * 1000)
  if (dateVal instanceof Date) return dateVal
  const d = new Date(dateVal)
  return isNaN(d.getTime()) ? null : d
}

function RevenueChart({ onCurrentMonthRevenue }) {
  const colors = useColors()
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState([])
  const [totals, setTotals] = useState({ plateforme: 0, encaisse: 0 })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [allRequests, payments, properties] = await Promise.all([
          getAllServiceRequests(),
          getRentPayments(),
          getManagedProperties(),
        ])
        const moving = allRequests.filter((r) => r.category === 'demenagement')
        const rental = allRequests.filter((r) => r.category === 'gestion-locative')
        const legal = allRequests.filter((r) => r.category === 'securisation-fonciere')
        const propertiesById = Object.fromEntries(properties.map((p) => [p.id, p]))

        const now = new Date()
        const months = Array.from({ length: MONTHS_BACK }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS_BACK - 1 - i), 1)
          return {
            key: `${d.getFullYear()}-${d.getMonth()}`,
            label: d.toLocaleDateString('fr-FR', { month: 'short' }),
            plateforme: 0,
            encaisse: 0,
          }
        })
        const byKey = Object.fromEntries(months.map((m) => [m.key, m]))

        // platformAmount = revenu réel de la plateforme ; grossAmount = total encaissé (peut inclure des sommes reversées, ex: loyers)
        const addAmount = (dateVal, platformAmount, grossAmount = platformAmount) => {
          const date = parseItemDate(dateVal)
          if (!date) return
          const key = `${date.getFullYear()}-${date.getMonth()}`
          if (!byKey[key]) return
          byKey[key].plateforme += platformAmount || 0
          byKey[key].encaisse += grossAmount || 0
        }

        moving.forEach((r) => {
          if (r.status === 'completed') {
            const amount = Number(r.price || r.estimatedPrice || r.amount || 0)
            addAmount(r.createdAt, amount)
          }
        })
        payments.forEach((p) => {
          const commissionRate = propertiesById[p.propertyId]?.commissionRate || 0
          const grossAmount = Number(p.amountPaid || p.amount || 0)
          addAmount(p.createdAt || p.paymentDate, grossAmount * (commissionRate / 100), grossAmount)
        })
        rental.forEach((r) => {
          if (r.status === 'completed') {
            const amount = Number(r.amount || r.fee || 0)
            addAmount(r.createdAt, amount)
          }
        })
        legal.forEach((r) => {
          if (r.status === 'completed') {
            const amount = Number(r.price || r.fee || r.amount || 0)
            addAmount(r.createdAt, amount)
          }
        })

        setData(months)
        setTotals({
          plateforme: months.reduce((sum, m) => sum + m.plateforme, 0),
          encaisse: months.reduce((sum, m) => sum + m.encaisse, 0),
        })
        onCurrentMonthRevenue?.(months[months.length - 1]?.plateforme || 0)
      } catch (error) {
        console.error('Erreur lors du chargement du revenu:', error)
      }
      setIsLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]))
    return (
      <div
        className="rounded-lg border border-gray-100 bg-white px-3 py-2 shadow-md"
        style={{ boxShadow: colors.shadow }}
      >
        <p className="text-xs font-semibold capitalize text-gray-500">{label}</p>
        <p className="text-sm font-bold" style={{ color: colors.primary }}>
          {formatGNF(byKey.plateforme)} <span className="font-normal text-gray-400">plateforme</span>
        </p>
        <p className="text-xs text-gray-500">
          {formatGNF(byKey.encaisse)} <span className="text-gray-400">encaissé au total</span>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Revenu plateforme
          </p>
          <p className="mt-1 text-2xl font-extrabold" style={{ color: colors.gray900 }}>
            {formatGNF(totals.plateforme)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{MONTHS_BACK} derniers mois</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Total encaissé
          </p>
          <p className="mt-1 text-2xl font-extrabold text-gray-400">
            {formatGNF(totals.encaisse)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">commissions + loyers reversés</p>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.primary }} />
          <span className="text-xs font-medium text-gray-600">Revenu plateforme</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.gray300 }} />
          <span className="text-xs font-medium text-gray-600">Total encaissé</span>
        </div>
      </div>

      <div className="mt-2 h-64">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Chargement...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="grossFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.gray300} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={colors.gray300} stopOpacity={0} />
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
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: colors.gray200 }} />
              <Area
                type="monotone"
                dataKey="encaisse"
                stroke={colors.gray300}
                strokeWidth={1.5}
                fill="url(#grossFill)"
                dot={false}
                activeDot={{ r: 4, fill: colors.gray400, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="plateforme"
                stroke={colors.primary}
                strokeWidth={2}
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

function DashboardCard() {
  const colors = useColors()
  const notifications = useNotifications()
  const AuthUser = useAuthUser()

  const [stats, setStats] = useState({
    agents: { approved: 0, pending: 0 },
    workers: { approved: 0, pending: 0 },
    customers: 0,
    managers: 0,
    legalPartners: 0,
    agencies: { active: 0, total: 0 },
    properties: { published: 0, draft: 0 },
  })
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [recentLeads, setRecentLeads] = useState([])
  const [leadsLoading, setLeadsLoading] = useState(true)

  useEffect(() => {
    if (AuthUser.claims?.userType !== 'admin') return
    getLeads()
      .then((leads) => setRecentLeads(leads.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLeadsLoading(false))
  }, [AuthUser.claims?.userType])

  useEffect(() => {
    if (AuthUser.claims?.userType !== 'admin') return

    const fetchData = async () => {
      try {
        const agentRequestsRef = collection(db, 'agent_requests')
        const workersRef = collection(db, 'workers')
        const usersRef = collection(db, 'users')
        const legalPartnersRef = collection(db, 'legalPartners')
        const agenciesRef = collection(db, 'partner_agencies')
        const housesRef = collection(db, 'houses')
        const landsRef = collection(db, 'lands')
        const dailyRentalsRef = collection(db, 'daily_rentals')

        const [
          snapAgentsApproved,
          snapAgentsPending,
          snapWorkersApproved,
          snapWorkersPending,
          snapCustomers,
          snapManagers,
          snapLegalPartners,
          snapAgencies,
          snapHouses,
          snapLands,
          snapDailyRentals,
        ] = await Promise.all([
          getDocs(query(agentRequestsRef, where('status', '==', 'approved'))),
          getDocs(query(agentRequestsRef, where('status', '==', 'pending'))),
          getDocs(query(workersRef, where('status', '==', 'approved'))),
          getDocs(query(workersRef, where('status', '==', 'pending'))),
          getDocs(query(usersRef, where('type', '==', 'customer'))),
          getDocs(query(usersRef, where('type', 'in', ['manager', 'admin']))),
          getDocs(legalPartnersRef),
          getDocs(agenciesRef),
          getDocs(housesRef),
          getDocs(landsRef),
          getDocs(dailyRentalsRef),
        ])

        const allProperties = [...snapHouses.docs, ...snapLands.docs, ...snapDailyRentals.docs]
        const publishedProperties = allProperties.filter(
          (d) => (d.data().status || 'available') === 'available'
        ).length

        setStats({
          agents: { approved: snapAgentsApproved.size, pending: snapAgentsPending.size },
          workers: { approved: snapWorkersApproved.size, pending: snapWorkersPending.size },
          customers: snapCustomers.size,
          managers: snapManagers.size,
          legalPartners: snapLegalPartners.size,
          agencies: {
            active: snapAgencies.docs.filter((d) => d.data().active).length,
            total: snapAgencies.size,
          },
          properties: {
            published: publishedProperties,
            draft: allProperties.length - publishedProperties,
          },
        })
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      }
    }

    fetchData()
  }, [AuthUser.claims?.userType])

  // `accent` réservé à une seule tuile par page : celle qui réclame une
  // attention immédiate (cf. proposition de palette validée). Les autres
  // tuiles restent sur le traitement neutre/primaire par défaut.
  const StatCard = ({ icon: Icon, label, value, subValue, accent = false }) => (
    <div
      className="group flex h-full flex-col justify-between rounded-xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={
        accent
          ? { background: `linear-gradient(155deg, ${colors.orangeAccent} 0%, ${colors.orangeHover} 100%)` }
          : { backgroundColor: colors.white, border: `1px solid ${colors.gray100}` }
      }
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: accent ? 'rgba(255,255,255,0.85)' : colors.gray400 }}
          >
            {label}
          </p>
          <p
            className="mt-2 font-mono text-3xl font-extrabold"
            style={{ color: accent ? '#FFFFFF' : colors.gray900 }}
          >
            {value}
          </p>
          {subValue && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={
                accent
                  ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }
                  : { backgroundColor: colors.primaryVeryLight, color: colors.primaryDark }
              }
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: accent ? '#FFFFFF' : colors.primary }}
              />
              {subValue}
            </div>
          )}
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl transition-colors group-hover:scale-105"
          style={{ backgroundColor: accent ? 'rgba(255,255,255,0.2)' : colors.primaryVeryLight }}
        >
          <Icon className="h-6 w-6" style={{ color: accent ? '#FFFFFF' : colors.primary }} />
        </div>
      </div>
    </div>
  )

  if (AuthUser.claims?.userType !== 'admin') {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Bienvenue sur le portail BâtiMoo Admin.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ligne principale — reprend exactement les 4 tuiles de la
          proposition de palette validée (mêmes libellés, même tuile
          orange accent), avec les vraies données. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Home}
          label="Biens gérés"
          value={stats.properties.published}
          subValue={`${stats.properties.draft} en brouillon`}
        />
        <StatCard
          icon={Wallet}
          label="Revenus du mois"
          value={formatGNF(monthlyRevenue)}
        />
        <StatCard
          icon={CalendarCheck}
          label="Demandes de visite"
          value={notifications.pendingLeads > 0 ? `${notifications.pendingLeads} nouvelles` : 'Aucune nouvelle'}
          accent={notifications.pendingLeads > 0}
        />
        <StatCard
          icon={Hammer}
          label="Candidatures ouvriers"
          value={stats.workers.pending}
        />
      </div>

      <RevenueChart onCurrentMonthRevenue={setMonthlyRevenue} />

      {/* Demandes de visite récentes — même tableau, même StatusPill que
          la page /leads, qui sert de référence exacte pour tous les
          tableaux de l'admin. */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Demandes de visite récentes</h2>
          <Link href="/leads">
            <a
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: colors.primary }}
            >
              Voir tout
              <RiArrowRightLine className="h-3.5 w-3.5" />
            </a>
          </Link>
        </div>

        {leadsLoading ? (
          <div className="flex h-24 items-center justify-center text-sm text-gray-400">
            Chargement...
          </div>
        ) : recentLeads.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-gray-400">
            Aucune demande de visite pour le moment
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>
                    {['Demandeur', 'Annonce', 'Reçu le', 'Statut'].map((h) => (
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
                  {recentLeads.map((lead) => {
                    const meta = LEAD_STATUS_META[lead.status] || LEAD_STATUS_META.new
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                          <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-gray-500">
                            <RiPhoneLine className="h-3.5 w-3.5" /> {lead.phone}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="max-w-xs truncate text-sm text-gray-700">
                            {lead.listingTitle}
                          </p>
                          <span
                            className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ backgroundColor: colors.gray100, color: colors.gray600 }}
                          >
                            {lead.listingType === 'lands' ? (
                              <RiLandscapeLine className="h-3 w-3" />
                            ) : (
                              <RiHome4Line className="h-3 w-3" />
                            )}
                            {lead.listingType === 'lands' ? 'Terrain' : 'Bien'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                          {firebaseDateFormat(lead.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Autres indicateurs — le reste des chiffres existants, en
          traitement neutre/primaire par défaut (aucun accent en plus,
          l'orange reste réservé à la tuile "Demandes de visite" ci-dessus). */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-900">Autres indicateurs</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={Briefcase}
            label="Agents"
            value={stats.agents.approved}
            subValue={`${stats.agents.pending} en attente de validation`}
          />
          <StatCard
            icon={Hammer}
            label="Ouvriers / Artisans"
            value={stats.workers.approved}
            subValue={`${stats.workers.pending} en attente de validation`}
          />
          <StatCard icon={Users} label="Utilisateurs" value={stats.customers} />
          <StatCard icon={ShieldCheck} label="Managers & admins" value={stats.managers} />
          <StatCard icon={Scale} label="Partenaires légaux" value={stats.legalPartners} />
          <StatCard
            icon={Building2}
            label="Agences sponsorisées"
            value={stats.agencies.active}
            subValue={`${stats.agencies.total} au total`}
          />
        </div>
      </div>
    </div>
  )
}

export default DashboardCard
