import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  RiArrowLeftLine,
  RiPhoneLine,
  RiWhatsappLine,
  RiMapPinLine,
  RiUserLine,
  RiStarFill,
  RiDeleteBinLine,
  RiImageFill,
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
import ConfirmModal from '@/components/ConfirmModal'
import PaginationButton from '@/components/Orders/PaginationButton'
import { getWorkerById } from '@/lib/services/workers'
import {
  desableUser,
  desableUserFirestore,
  getUserAvailability,
} from '@/lib/services/managers'
import { getWorkerReviews, deleteWorkerReview } from '@/lib/services/workerReviews'

const PAGE_SIZE = 10

function WorkerDetail() {
  const colors = useColors()
  const router = useRouter()
  const { workerId } = router.query

  const [worker, setWorker] = useState(null)
  const [reviews, setReviews] = useState([])
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(PAGE_SIZE)
  const [isAvailable, setIsAvailable] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState(null)

  useEffect(() => {
    if (!workerId) return
    const load = async () => {
      setIsLoading(true)
      try {
        const workerData = await getWorkerById(workerId)
        setWorker(workerData)
        const [available, reviewsData] = await Promise.all([
          getUserAvailability(workerData?.userId),
          getWorkerReviews(workerId),
        ])
        setIsAvailable(available)
        setReviews(reviewsData)
        setVisibleReviewsCount(PAGE_SIZE)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [workerId])

  const handleToggleBlock = async () => {
    const nextAvailable = !isAvailable
    try {
      await desableUser(worker.userId, !nextAvailable)
      await desableUserFirestore(worker.userId, nextAvailable)
      setIsAvailable(nextAvailable)
      notify('Action effectuée avec succès', 'success')
      setBlockModalOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleDeleteReview = async () => {
    try {
      const remaining = await deleteWorkerReview(workerId, reviewToDelete.id)
      setReviews(remaining)
      setWorker((prev) => ({
        ...prev,
        rating: remaining.length
          ? Math.round((remaining.reduce((s, r) => s + r.rating, 0) / remaining.length) * 10) / 10
          : 0,
        reviewsCount: remaining.length,
      }))
      notify('Avis supprimé avec succès', 'success')
      setReviewToDelete(null)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  if (isLoading) {
    return (
      <Scaffold>
        <div className="flex h-64 items-center justify-center">
          <Loader color="#111827" />
        </div>
      </Scaffold>
    )
  }

  if (!worker) {
    return (
      <Scaffold>
        <div className="flex h-64 items-center justify-center">
          <p className="text-gray-500">Ouvrier introuvable</p>
        </div>
      </Scaffold>
    )
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
          title="Bloquer l'ouvrier"
          desable={isAvailable}
          message={
            isAvailable
              ? "Bloquer cet ouvrier l'empêchera de se connecter et son profil ne sera plus visible."
              : 'Débloquer cet ouvrier lui redonnera accès à son compte.'
          }
          confirmFunction={handleToggleBlock}
          open={blockModalOpen}
          setOpen={setBlockModalOpen}
        />

        <ConfirmModal
          open={!!reviewToDelete}
          setOpen={() => setReviewToDelete(null)}
          title="Supprimer l'avis"
          description="Êtes-vous sûr de supprimer cet avis ? Cette action est irréversible."
          confirmFunction={handleDeleteReview}
          cancelFuction={() => {}}
        />

        {/* Profil */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                {worker.imageUrl ? (
                  <img src={worker.imageUrl} alt={worker.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <RiUserLine className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{worker.name}</h1>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-400">
                  {worker.accountType === 'enterprise' ? 'Entreprise' : 'Particulier'}
                  {worker.experienceYears ? ` · ${worker.experienceYears} ans d'expérience` : ''}
                  {worker.priceRange ? ` · ${worker.priceRange}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {worker.phone && (
                    <span className="flex items-center gap-1.5">
                      <RiPhoneLine className="h-4 w-4 text-gray-400" /> {worker.phone}
                    </span>
                  )}
                  {worker.whatsapp && (
                    <span className="flex items-center gap-1.5">
                      <RiWhatsappLine className="h-4 w-4 text-gray-400" /> {worker.whatsapp}
                    </span>
                  )}
                  {worker.rating > 0 && (
                    <span className="flex items-center gap-1.5">
                      <RiStarFill className="h-4 w-4" style={{ color: colors.primary }} />
                      {worker.rating} ({worker.reviewsCount || 0} avis)
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(worker.specialties || []).map((s) => (
                    <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                      {s}
                    </span>
                  ))}
                </div>
                {worker.communes?.length > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <RiMapPinLine className="h-3.5 w-3.5" /> {worker.communes.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {worker.userId && (
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
            )}
          </div>

          {worker.description && (
            <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-600">
              {worker.description}
            </p>
          )}
        </div>

        {/* Réalisations */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Réalisations</h2>
          {worker.realizations?.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {worker.realizations.map((r, i) => (
                <div key={i} className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="aspect-square bg-gray-50">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <RiImageFill className="h-6 w-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <p className="p-2 text-xs font-semibold text-gray-700">{r.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucune réalisation ajoutée</p>
          )}
        </div>

        {/* Avis */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
            Avis ({reviews.length})
          </h2>
          {reviews.length > 0 ? (
            <>
              <div className="divide-y divide-gray-100">
                {reviews.slice(0, visibleReviewsCount).map((review) => (
                  <div key={review.id} className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{review.userName}</p>
                        <span className="flex items-center gap-0.5 text-xs text-gray-500">
                          <RiStarFill className="h-3.5 w-3.5" style={{ color: colors.primary }} />
                          {review.rating}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setReviewToDelete(review)}
                      className="flex-shrink-0 rounded-lg border border-gray-200 p-2 text-gray-400 hover:border-red-200 hover:text-red-500"
                      title="Supprimer l'avis"
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              {visibleReviewsCount < reviews.length && (
                <PaginationButton
                  getmoreData={() => setVisibleReviewsCount((c) => c + PAGE_SIZE)}
                />
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Aucun avis pour le moment</p>
          )}
        </div>
      </div>
    </Scaffold>
  )
}

const WorkerDetailPage = () => (
  <Page name="Ouvrier | HabitatGN">
    <WorkerDetail />
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
})(WorkerDetailPage)
