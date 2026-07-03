import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import {
  RiArrowLeftLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiHome4Line,
  RiLandscapeLine,
  RiCalendarLine,
  RiCalendarCheckLine,
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
import { useInfiniteHouses } from '@/lib/hooks/useHouses'
import { useInfiniteLands } from '@/lib/hooks/useLands'
import { useInfiniteDailyRentals } from '@/lib/hooks/useDailyRentals'
import HousesList from '@/components/houses/HouseList'
import LandList from '@/components/lands/LandList'
import DailyRentalList from '@/components/dailyRentals/DailyRentalList'
import AgentBookingsTable from '@/components/bookings/AgentBookingsTable'

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
  const [activeTab, setActiveTab] = useState('houses')

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

  const housesQuery = useInfiniteHouses('manager', agentId)
  const landsQuery = useInfiniteLands('manager', agentId)
  const dailyRentalsQuery = useInfiniteDailyRentals('manager', agentId)

  const houses = useMemo(
    () => housesQuery.data?.pages.flatMap((p) => p.houses) || [],
    [housesQuery.data]
  )
  const lands = useMemo(
    () => landsQuery.data?.pages.flatMap((p) => p.lands) || [],
    [landsQuery.data]
  )
  const dailyRentals = useMemo(
    () => dailyRentalsQuery.data?.pages.flatMap((p) => p.dailyRentals) || [],
    [dailyRentalsQuery.data]
  )

  const TABS = [
    { value: 'houses', label: 'Biens immobiliers', icon: RiHome4Line, count: houses.length },
    { value: 'lands', label: 'Terrains', icon: RiLandscapeLine, count: lands.length },
    { value: 'dailyRentals', label: 'Locations journalières', icon: RiCalendarLine, count: dailyRentals.length },
    { value: 'bookings', label: 'Réservations', icon: RiCalendarCheckLine, count: null },
  ]

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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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

        {/* Onglets biens */}
        <div className="mb-4 flex gap-2 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
              style={
                activeTab === tab.value
                  ? { borderColor: colors.primary, color: colors.primary }
                  : { borderColor: 'transparent', color: colors.gray500 }
              }
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== null && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs"
                  style={
                    activeTab === tab.value
                      ? { backgroundColor: colors.primaryVeryLight, color: colors.primary }
                      : { backgroundColor: colors.gray100, color: colors.gray500 }
                  }
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'houses' && (
          <HousesList
            houses={houses}
            showMore={housesQuery.fetchNextPage}
            hasMore={housesQuery.hasNextPage}
            isLoading={housesQuery.isLoading}
            isFetchingMore={housesQuery.isFetchingNextPage}
            data={{ houses }}
            setData={() => {}}
          />
        )}

        {activeTab === 'lands' && (
          <LandList
            data={{ lands }}
            setData={() => {}}
            lands={lands}
            showMore={landsQuery.fetchNextPage}
            hasMore={landsQuery.hasNextPage}
            pagination={landsQuery.hasNextPage}
            isLoading={landsQuery.isLoading}
            isLoadingP={landsQuery.isFetchingNextPage}
          />
        )}

        {activeTab === 'dailyRentals' && (
          <DailyRentalList
            data={{ dailyRentals }}
            setData={() => {}}
            dailyRentals={dailyRentals}
            showMore={dailyRentalsQuery.fetchNextPage}
            hasMore={dailyRentalsQuery.hasNextPage}
            pagination={dailyRentalsQuery.hasNextPage}
            isLoading={dailyRentalsQuery.isLoading}
            isLoadingP={dailyRentalsQuery.isFetchingNextPage}
          />
        )}

        {activeTab === 'bookings' && (
          <AgentBookingsTable agentId={agentId} dailyRentals={dailyRentals} />
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
