import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  RiArrowLeftLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
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
import Loader from '@/components/Loader'
import DesableConfirmModal from '@/components/DesableConfirm'
import { getAgentRequestByUserId } from '@/lib/services/agentRequests'
import {
  desableUser,
  desableUserFirestore,
  getUserAvailability,
} from '@/lib/services/managers'

const PROPERTY_TYPE_LABELS = {
  location: 'Location',
  journaliere: 'Location journalière',
  vente: 'Vente',
  terrain: 'Terrain',
}

function AgentDetail() {
  const colors = useColors()
  const router = useRouter()
  const { agentId } = router.query

  const [agent, setAgent] = useState(null)
  const [isAvailable, setIsAvailable] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [blockModalOpen, setBlockModalOpen] = useState(false)

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
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [agentId])

  const handleToggleBlock = async () => {
    const nextAvailable = !isAvailable
    try {
      await desableUser(agentId, !nextAvailable)
      await desableUserFirestore(agentId, nextAvailable)
      setIsAvailable(nextAvailable)
      notify('Action effectuée avec succès', 'success')
      setBlockModalOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  return (
    <Scaffold>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
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

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : (
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
          </div>
        )}
      </div>
    </Scaffold>
  )
}

const AgentDetailPage = () => (
  <Page name="Agent | HabitatGN">
    <AgentDetail />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (AuthUser.claims.userType !== 'admin') {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(AgentDetailPage)
