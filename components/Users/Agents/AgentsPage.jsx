import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  RiCheckLine,
  RiCloseLine,
  RiUserLine,
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiProfileLine,
  RiMore2Fill,
  RiSearchLine,
  RiAddLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import CreateUserDrawer from '@/components/Users/CreateUserDrawer'
import {
  getAgentRequests,
  approveAgentRequest,
  rejectAgentRequest,
} from '@/lib/services/agentRequests'
import {
  desableUser,
  desableUserFirestore,
  getUserAvailability,
} from '@/lib/services/managers'
import {
  getAllAgentPayments,
  getAgentSubscriptionAmount,
  recordAgentPayment,
  computeAgentPaymentStatus,
} from '@/lib/services/agentPayments'
import {
  deactivatePropertiesForOwner,
  reactivatePropertiesForOwner,
} from '@/lib/services/managedProperties'
import { PAYMENT_STATUS_CONFIG } from './paymentStatusConfig'
import RecordPaymentModal from './RecordPaymentModal'
import AgentRevenueChart from './AgentRevenueChart'
import DesableConfirmModal from '@/components/DesableConfirm'
import PaginationButton from '@/components/Orders/PaginationButton'
import { firebaseDateFormat } from '@/utils/date'

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvées' },
  { value: 'rejected', label: 'Rejetées' },
]

const REVENUE_TAB = { value: 'revenue', label: 'Revenus' }

const PROPERTY_TYPE_LABELS = {
  location: 'Location',
  journaliere: 'Location journalière',
  vente: 'Vente',
  terrain: 'Terrain',
}

export default function AgentsPage() {
  const colors = useColors()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [actioningId, setActioningId] = useState(null)
  const [blockTarget, setBlockTarget] = useState(null)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [subscriptionAmount, setSubscriptionAmount] = useState(0)
  const [paymentTarget, setPaymentTarget] = useState(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [payments, setPayments] = useState([])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [statusFilter, searchTerm])

  useEffect(() => {
    getAgentSubscriptionAmount().then(setSubscriptionAmount).catch(() => {})
  }, [])

  const fetchAgentsData = async () => {
    setIsLoading(true)
    try {
      const [data, allPayments] = await Promise.all([getAgentRequests(), getAllAgentPayments()])
      const withAvailability = await Promise.all(
        data.map(async (r) => ({
          ...r,
          isAvailable: await getUserAvailability(r.userId),
          paymentStatus: computeAgentPaymentStatus(
            r,
            allPayments.filter((p) => p.agentId === r.id)
          ),
        }))
      )
      setRequests(withAvailability)
      setPayments(allPayments)
    } catch (e) {
      notify('Erreur lors du chargement', 'error')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAgentsData()
  }, [])

  const handleApprove = async (request) => {
    setActioningId(request.id)
    try {
      await approveAgentRequest(request.id, request.userId)
      const approvedAt = new Date()
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: 'approved',
                approvedAt,
                paymentStatus: computeAgentPaymentStatus({ ...r, status: 'approved', approvedAt }, []),
              }
            : r
        )
      )
      notify('Candidature approuvée', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setActioningId(null)
    setMenuOpenId(null)
  }

  const handleReject = async (request) => {
    setActioningId(request.id)
    try {
      await rejectAgentRequest(request.id)
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id ? { ...r, status: 'rejected' } : r
        )
      )
      notify('Candidature rejetée', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setActioningId(null)
    setMenuOpenId(null)
  }

  const handleToggleBlock = async () => {
    if (!blockTarget) return
    const nextAvailable = !blockTarget.isAvailable
    try {
      await desableUser(blockTarget.userId, !nextAvailable)
      await desableUserFirestore(blockTarget.userId, nextAvailable)
      setRequests((prev) =>
        prev.map((r) =>
          r.id === blockTarget.id ? { ...r, isAvailable: nextAvailable } : r
        )
      )

      const count = nextAvailable
        ? await reactivatePropertiesForOwner(blockTarget.userId)
        : await deactivatePropertiesForOwner(blockTarget.userId)

      notify(
        count > 0
          ? nextAvailable
            ? `Agent réactivé — ${count} bien${count > 1 ? 's' : ''} republié${count > 1 ? 's' : ''}`
            : `Agent suspendu — ${count} bien${count > 1 ? 's' : ''} masqué${count > 1 ? 's' : ''}`
          : 'Action effectuée avec succès',
        'success'
      )
      setBlockModalOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleRecordPayment = async (amount, paidAt, monthsCovered) => {
    if (!paymentTarget) return
    try {
      await recordAgentPayment(paymentTarget.id, amount, paidAt, monthsCovered)
      const allPayments = await getAllAgentPayments()
      setRequests((prev) =>
        prev.map((r) => ({
          ...r,
          paymentStatus: computeAgentPaymentStatus(
            r,
            allPayments.filter((p) => p.agentId === r.id)
          ),
        }))
      )
      setPayments(allPayments)
      notify('Paiement enregistré', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filtered = requests.filter((r) => {
    const matchStatus = (r.status || 'pending') === statusFilter
    if (!matchStatus) return false
    if (!searchTerm) return true
    const lower = searchTerm.toLowerCase()
    return (
      r.fullName?.toLowerCase().includes(lower) ||
      r.email?.toLowerCase().includes(lower) ||
      r.phone?.toLowerCase().includes(lower) ||
      r.commune?.toLowerCase().includes(lower) ||
      r.agencyName?.toLowerCase().includes(lower)
    )
  })
  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="mx-auto px-4 py-6 sm:px-6 md:px-8">
      <DesableConfirmModal
        title="Bloquer l'agent"
        desable={blockTarget?.isAvailable}
        message={
          blockTarget?.isAvailable
            ? "Bloquer cet agent l'empêchera de se connecter à son compte."
            : 'Débloquer cet agent lui redonnera accès à son compte.'
        }
        confirmFunction={handleToggleBlock}
        open={blockModalOpen}
        setOpen={setBlockModalOpen}
      />

      <RecordPaymentModal
        open={paymentModalOpen}
        setOpen={setPaymentModalOpen}
        defaultAmount={subscriptionAmount}
        onConfirm={handleRecordPayment}
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Agents</h2>
            <p className="mt-1 text-sm text-gray-500">
              Candidatures pour devenir agent immobilier sur le site public
            </p>
          </div>
          {statusFilter !== REVENUE_TAB.value && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher nom, agence, téléphone..."
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setCreateDrawerOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:translate-y-px"
                style={{ backgroundColor: colors.primary }}
              >
                <RiAddLine className="h-4 w-4" />
                Ajouter un Agent
              </button>
            </div>
          )}
        </div>

        <CreateUserDrawer
          open={createDrawerOpen}
          setOpen={setCreateDrawerOpen}
          defaultRole="agent"
          onCreate={() => {
            fetchAgentsData()
          }}
        />

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {[...STATUS_FILTERS, REVENUE_TAB].map((f) => {
            const isRevenueTab = f.value === REVENUE_TAB.value
            const count = isRevenueTab
              ? null
              : requests.filter((r) => (r.status || 'pending') === f.value).length
            const active = statusFilter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className="flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
                style={
                  active
                    ? { borderColor: colors.primary, color: colors.primary }
                    : { borderColor: 'transparent', color: colors.gray500 }
                }
              >
                {f.label}
                {count !== null && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-xs"
                    style={
                      active
                        ? {
                            backgroundColor: colors.primaryVeryLight,
                            color: colors.primary,
                          }
                        : {
                            backgroundColor: colors.gray100,
                            color: colors.gray500,
                          }
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {statusFilter === REVENUE_TAB.value ? (
          <AgentRevenueChart payments={payments} isLoading={isLoading} />
        ) : isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiUserLine className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              Aucune candidature dans cette catégorie
            </p>
          </div>
        ) : (
          <div className="overflow-visible rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>
                    {[
                      'Agent',
                      'Contact',
                      'Commune',
                      'Types de biens',
                      'Statut',
                      'Abonnement',
                      'Actions',
                    ].map((h) => (
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
                  {visible.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">
                          {request.fullName}
                        </p>
                        <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">
                          {request.accountType === 'agence'
                            ? `Agence — ${request.agencyName || ''}`
                            : 'Particulier'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {request.email && (
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <RiMailLine className="h-3.5 w-3.5" />{' '}
                            {request.email}
                          </p>
                        )}
                        {request.phone && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <RiPhoneLine className="h-3.5 w-3.5" />{' '}
                            {request.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {request.commune && (
                          <p className="flex items-center gap-1 text-xs capitalize text-gray-500">
                            <RiMapPinLine className="h-3.5 w-3.5" />{' '}
                            {request.commune}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {(request.propertyTypes || []).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {PROPERTY_TYPE_LABELS[t] || t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: request.isAvailable
                              ? colors.primaryVeryLight
                              : colors.gray100,
                            color: request.isAvailable
                              ? colors.primaryDark
                              : colors.gray600,
                          }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: request.isAvailable
                                ? colors.primary
                                : colors.gray500,
                            }}
                          />
                          {request.isAvailable ? 'Actif' : 'Bloqué'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {request.paymentStatus?.status !== 'unknown' && (
                          <>
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor:
                                  PAYMENT_STATUS_CONFIG[request.paymentStatus.status].bg,
                                color: PAYMENT_STATUS_CONFIG[request.paymentStatus.status].color,
                              }}
                            >
                              {PAYMENT_STATUS_CONFIG[request.paymentStatus.status].label}
                            </span>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {request.paymentStatus.status === 'trial'
                                ? `Essai jusqu'au ${firebaseDateFormat(request.paymentStatus.trialEndAt)}`
                                : request.paymentStatus.nextDueAt
                                ? `Échéance ${firebaseDateFormat(request.paymentStatus.nextDueAt)}`
                                : ''}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {actioningId === request.id ? (
                          <Loader color="#111827" />
                        ) : (
                          <div className="relative flex justify-end">
                            <button
                              onClick={() =>
                                setMenuOpenId((prev) =>
                                  prev === request.id ? null : request.id
                                )
                              }
                              className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                              title="Actions"
                            >
                              <RiMore2Fill className="h-4 w-4" />
                            </button>

                            {menuOpenId === request.id && (
                              <div className="absolute right-0 top-full z-[60] mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                                {request.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => handleApprove(request)}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                      <RiCheckLine
                                        className="h-4 w-4"
                                        style={{ color: colors.primary }}
                                      />
                                      Approuver la candidature
                                    </button>
                                    <button
                                      onClick={() => handleReject(request)}
                                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                      <RiCloseLine className="h-4 w-4 text-gray-400" />
                                      Rejeter la candidature
                                    </button>
                                  </>
                                )}

                                {request.status === 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMenuOpenId(null)
                                      setPaymentTarget(request)
                                      setPaymentModalOpen(true)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    <RiMoneyDollarCircleLine
                                      className="h-4 w-4"
                                      style={{ color: colors.primary }}
                                    />
                                    Enregistrer un paiement
                                  </button>
                                )}

                                {request.status === 'approved' &&
                                  request.userId && (
                                    <>
                                      <Link href={`/agents/${request.userId}`}>
                                        <a
                                          onClick={() => setMenuOpenId(null)}
                                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                          <RiProfileLine className="h-4 w-4 text-gray-400" />
                                          Voir détail et ses biens
                                        </a>
                                      </Link>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMenuOpenId(null)
                                          setBlockTarget(request)
                                          setBlockModalOpen(true)
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                      >
                                        <span
                                          className="h-2 w-2 rounded-full"
                                          style={{
                                            backgroundColor: request.isAvailable
                                              ? colors.gray700
                                              : colors.primary,
                                          }}
                                        />
                                        {request.isAvailable
                                          ? 'Bloquer le compte'
                                          : 'Débloquer le compte'}
                                      </button>
                                    </>
                                  )}

                                {request.status === 'rejected' && (
                                  <p className="px-3 py-2.5 text-sm text-gray-400">
                                    Aucune action disponible
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visibleCount < filtered.length && (
              <PaginationButton
                getmoreData={() => setVisibleCount((c) => c + PAGE_SIZE)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
