import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  RiArrowLeftLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
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
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

const PROPERTY_TYPE_LABELS = {
  location: 'Location',
  journaliere: 'Location journalière',
  vente: 'Vente',
  terrain: 'Terrain',
}

function StatCard({ label, value, color, bgColor }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 shadow-sm" style={{ backgroundColor: bgColor || '#F9FAFB' }}>
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

function AgentDetail() {
  const colors = useColors()
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

  useEffect(() => {
    if (!agentId) return
    const load = async () => {
      setIsLoading(true)
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
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <RiArrowLeftLine className="mr-1.5 h-4 w-4" />
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
            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {agent?.fullName || 'Agent'}
                  </h1>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">
                    {agent?.accountType === 'agence'
                      ? `Agence — ${agent?.agencyName || ''}`
                      : 'Particulier'}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    {agent?.email && (
                      <span className="flex items-center gap-1.5">
                        <RiMailLine className="h-4 w-4 text-gray-400" /> {agent.email}
                      </span>
                    )}
                    {agent?.phone && (
                      <span className="flex items-center gap-1.5">
                        <RiPhoneLine className="h-4 w-4 text-gray-400" /> {agent.phone}
                      </span>
                    )}
                    {agent?.commune && (
                      <span className="flex items-center gap-1.5 capitalize">
                        <RiMapPinLine className="h-4 w-4 text-gray-400" /> {agent.commune}
                      </span>
                    )}
                  </div>
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: isAvailable ? colors.primary : colors.gray700 }}
                  />
                  {isAvailable ? 'Actif' : 'Bloqué'}
                </button>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Biens gérés" value={properties.length} color={colors.primary} bgColor={colors.primaryVeryLight} />
                <StatCard label="Occupés" value={occupiedCount} color={colors.success} bgColor="#ECFDF5" />
                <StatCard label="Loyers cumulés / mois" value={formatGNF(totalRent)} color={colors.gray900} bgColor={colors.gray50} />
              </div>
            </div>

            {/* Abonnement */}
            {agent?.status === 'approved' && paymentStatus && (
              <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Abonnement
                    </h2>
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: PAYMENT_STATUS_CONFIG[paymentStatus.status].bg,
                          color: PAYMENT_STATUS_CONFIG[paymentStatus.status].color,
                        }}
                      >
                        {PAYMENT_STATUS_CONFIG[paymentStatus.status].label}
                      </span>
                      <p className="text-xs text-gray-500">
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
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:translate-y-px"
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
                        <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
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

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'agents'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(AgentDetailPage)
