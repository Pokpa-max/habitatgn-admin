import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  RiArrowLeftLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiMoneyDollarCircleLine,
  RiHome4Line,
  RiCheckboxCircleLine,
  RiStarFill,
} from 'react-icons/ri'
import {
  AuthAction,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import Loader from '@/components/Loader'
import DesableConfirmModal from '@/components/DesableConfirm'
import { getAgentRequestByUserId } from '@/lib/services/agentRequests'
import {
  desableUser,
  desableUserFirestore,
  getUserAvailability,
} from '@/lib/services/managers'
import {
  getPropertiesByOwner,
  deactivatePropertiesForOwner,
  reactivatePropertiesForOwner,
} from '@/lib/services/managedProperties'
import {
  getAgentPayments,
  getAgentSubscriptionAmount,
  recordAgentPayment,
  computeAgentPaymentStatus,
} from '@/lib/services/agentPayments'
import { PAYMENT_STATUS_CONFIG } from '@/components/Users/Agents/paymentStatusConfig'
import RecordPaymentModal from '@/components/Users/Agents/RecordPaymentModal'
import { firebaseDateFormat } from '@/utils/date'
import BiensTab from '@/components/rentalManagement/BiensTab'
import AgentReviewsPanel from '@/components/Users/Agents/AgentReviewsPanel'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

const PROPERTY_TYPE_LABELS = {
  location: 'Location',
  journaliere: 'Location journalière',
  vente: 'Vente',
  terrain: 'Terrain',
}

function AgentDetail() {
  const colors = useColors()

  const StatCard = ({ icon: Icon, label, value, iconBg, iconColor, className = '' }) => (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-xl p-3 shadow-sm sm:gap-2.5 sm:p-4 ${className}`}
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
      <p className="break-words font-mono text-lg font-semibold tracking-tight sm:text-xl" style={{ color: colors.gray900 }}>
        {value}
      </p>
    </div>
  )
  const router = useRouter()
  const { agentId } = router.query

  const [agent, setAgent] = useState(null)
  const [properties, setProperties] = useState([])
  const [isAvailable, setIsAvailable] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [payments, setPayments] = useState([])
  const [subscriptionAmount, setSubscriptionAmount] = useState(0)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [reviewSummary, setReviewSummary] = useState(null)

  const handleReviewSummaryChange = useCallback((summary) => {
    setReviewSummary(summary)
  }, [])

  useEffect(() => {
    if (!agentId) return
    const load = async () => {
      setIsLoading(true)
      setReviewSummary(null)
      try {
        const [profile, available] = await Promise.all([
          getAgentRequestByUserId(agentId),
          getUserAvailability(agentId),
        ])
        setAgent(profile)
        setIsAvailable(available)

        const candidateIds = Array.from(
          new Set([agentId, profile?.userId, profile?.id].filter(Boolean))
        )

        const [propLists, paymentsData, amount] = await Promise.all([
          Promise.all(candidateIds.map((id) => getPropertiesByOwner(id))),
          profile?.id ? getAgentPayments(profile.id) : Promise.resolve([]),
          getAgentSubscriptionAmount(),
        ])

        const map = new Map()
        propLists.flat().forEach((p) => {
          if (p && p.id) map.set(p.id, p)
        })

        setProperties(Array.from(map.values()))
        setPayments(paymentsData)
        setSubscriptionAmount(amount)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [agentId])

  const paymentStatus = agent ? computeAgentPaymentStatus(agent, payments) : null

  const handleRecordPayment = async (amount, paidAt, monthsCovered) => {
    if (!agent?.id) return
    try {
      await recordAgentPayment(agent.id, amount, paidAt, monthsCovered)
      const refreshed = await getAgentPayments(agent.id)
      setPayments(refreshed)
      notify('Paiement enregistré', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleToggleBlock = async () => {
    const nextAvailable = !isAvailable
    try {
      await desableUser(agentId, !nextAvailable)
      await desableUserFirestore(agentId, nextAvailable)
      setIsAvailable(nextAvailable)

      const count = nextAvailable
        ? await reactivatePropertiesForOwner(agentId)
        : await deactivatePropertiesForOwner(agentId)

      if (count > 0) {
        const refreshed = await getPropertiesByOwner(agentId)
        setProperties(refreshed)
        notify(
          nextAvailable
            ? `Agent réactivé — ${count} bien${count > 1 ? 's' : ''} republié${count > 1 ? 's' : ''}`
            : `Agent suspendu — ${count} bien${count > 1 ? 's' : ''} masqué${count > 1 ? 's' : ''}`,
          'success'
        )
      } else {
        notify('Action effectuée avec succès', 'success')
      }
      setBlockModalOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const totalRent = properties.reduce((sum, p) => sum + (p.rentAmount || 0), 0)
  const occupiedCount = properties.filter((p) => p.status === 'occupied').length

  return (
    <Scaffold>
      <div className="mx-auto min-w-0 max-w-6xl py-4 sm:py-6">
        <button
          onClick={() => router.back()}
          className="group mb-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <RiArrowLeftLine className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Retour
        </button>

        <DesableConfirmModal
          title="Bloquer l'agent"
          desable={isAvailable}
          message={
            isAvailable
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

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : (
          <>
            {/* Profil de l'agent */}
            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm sm:mb-6 sm:p-6">
              <div className="flex min-w-0 flex-col items-start justify-between gap-4 sm:flex-row">
                <div className="min-w-0 w-full">
                  <h1 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
                    {agent?.fullName || 'Agent'}
                  </h1>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">
                    {agent?.accountType === 'agence'
                      ? `Agence — ${agent?.agencyName || ''}`
                      : 'Particulier'}
                  </p>
                  <div className="mt-3 grid min-w-0 gap-2 text-sm text-gray-600 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
                    {agent?.email && (
                      <a href={`mailto:${agent.email}`} className="flex min-w-0 items-start gap-1.5 break-all">
                        <RiMailLine className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> <span>{agent.email}</span>
                      </a>
                    )}
                    {agent?.phone && (
                      <a href={`tel:${agent.phone}`} className="flex min-w-0 items-center gap-1.5 break-all">
                        <RiPhoneLine className="h-4 w-4 shrink-0 text-gray-400" /> <span>{agent.phone}</span>
                      </a>
                    )}
                    {agent?.commune && (
                      <span className="flex min-w-0 items-center gap-1.5 capitalize">
                        <RiMapPinLine className="h-4 w-4 shrink-0 text-gray-400" /> <span className="break-words">{agent.commune}</span>
                      </span>
                    )}
                  </div>
                  {reviewSummary && !reviewSummary.loading && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                      <RiStarFill className="h-4 w-4" style={{ color: colors.orangeAccent }} />
                      {reviewSummary.count > 0 ? (
                        <>
                          <span className="font-semibold text-gray-900">
                            {reviewSummary.average.toLocaleString('fr-FR', {
                              minimumFractionDigits: 1,
                              maximumFractionDigits: 1,
                            })}{' '}
                            / 5
                          </span>
                          <span className="text-gray-500">
                            · {reviewSummary.count} avis client{reviewSummary.count > 1 ? 's' : ''}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">Aucun avis client</span>
                      )}
                    </div>
                  )}
                  {agent?.propertyTypes?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {agent.propertyTypes.map((t) => (
                        <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {PROPERTY_TYPE_LABELS[t] || t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setBlockModalOpen(true)}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: isAvailable ? colors.primary : colors.gray700 }}
                  />
                  {isAvailable ? 'Actif' : 'Bloqué'}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 sm:gap-4">
                <StatCard
                  icon={RiHome4Line}
                  label="Biens gérés"
                  value={properties.length}
                  iconBg={colors.primaryVeryLight}
                  iconColor={colors.primary}
                />
                <StatCard
                  icon={RiCheckboxCircleLine}
                  label="Occupés"
                  value={occupiedCount}
                  iconBg="#ECFDF5"
                  iconColor={colors.success}
                />
                <StatCard
                  icon={RiMoneyDollarCircleLine}
                  label="Loyers cumulés / mois"
                  value={formatGNF(totalRent)}
                  iconBg={colors.gray50}
                  iconColor={colors.gray600}
                  className="col-span-2 sm:col-span-1"
                />
              </div>
            </div>

            {/* Abonnement */}
            {agent?.status === 'approved' && paymentStatus && (
              <div className="mb-4 rounded-xl bg-white p-4 shadow-sm sm:mb-6 sm:p-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap">
                  <div className="min-w-0">
                    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Abonnement
                    </h2>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: PAYMENT_STATUS_CONFIG[paymentStatus.status].bg,
                          color: PAYMENT_STATUS_CONFIG[paymentStatus.status].color,
                        }}
                      >
                        {PAYMENT_STATUS_CONFIG[paymentStatus.status].label}
                      </span>
                      <p className="break-words text-xs text-gray-500">
                        {paymentStatus.status === 'trial'
                          ? `Essai gratuit jusqu'au ${firebaseDateFormat(paymentStatus.trialEndAt)}`
                          : paymentStatus.nextDueAt
                          ? `Prochaine échéance : ${firebaseDateFormat(paymentStatus.nextDueAt)}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPaymentModalOpen(true)}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:translate-y-px sm:w-auto"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <RiMoneyDollarCircleLine className="h-4 w-4" />
                    Enregistrer un paiement
                  </button>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Historique des paiements
                  </p>
                  {payments.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {payments.map((p) => (
                        <div key={p.id} className="flex flex-col gap-1 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-gray-600">
                            {firebaseDateFormat(p.paidAt)}
                            {p.monthsCovered > 1 && (
                              <span className="ml-2 text-xs text-gray-400">
                                ({p.monthsCovered} mois)
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-gray-900">{formatGNF(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Aucun paiement enregistré</p>
                  )}
                </div>
              </div>
            )}

            {/* Section Gestion des Biens de l'agent */}
            <BiensTab ownerId={agentId} onPropertiesChange={setProperties} />

            {/* Avis vérifiés laissés sur le site public */}
            <AgentReviewsPanel
              agentId={agentId}
              onSummaryChange={handleReviewSummaryChange}
            />
          </>
        )}
      </div>
    </Scaffold>
  )
}

const AgentDetailPage = () => (
  <Page name="Agent | BâtiMoo Admin">
    <AgentDetail />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'agents'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(AgentDetailPage)
