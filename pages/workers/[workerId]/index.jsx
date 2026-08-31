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
  RiMoneyDollarCircleLine,
  RiVipCrownLine,
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
import {
  getWorkerById,
  hideWorkerFromPublic,
  restoreWorkerVisibility,
  updateWorkerPlan,
} from '@/lib/services/workers'
import {
  desableUser,
  desableUserFirestore,
  getUserAvailability,
} from '@/lib/services/managers'
import { getWorkerReviews, deleteWorkerReview } from '@/lib/services/workerReviews'
import {
  getWorkerPayments,
  getWorkerSubscriptionAmount,
  recordWorkerPayment,
  computeWorkerPaymentStatus,
} from '@/lib/services/workerPayments'
import { PAYMENT_STATUS_CONFIG } from '@/components/Users/Workers/paymentStatusConfig'
import RecordPaymentModal from '@/components/Users/Workers/RecordPaymentModal'
import { firebaseDateFormat } from '@/utils/date'
import { formatGNF } from '@/utils/format'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

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
  const [payments, setPayments] = useState([])
  const [subscriptionAmount, setSubscriptionAmount] = useState(0)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [planValue, setPlanValue] = useState('free')
  const [planExpiresAtValue, setPlanExpiresAtValue] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)

  useEffect(() => {
    if (!workerId) return
    const load = async () => {
      setIsLoading(true)
      try {
        const workerData = await getWorkerById(workerId)
        setWorker(workerData)
        setPlanValue(workerData?.plan || 'free')
        const expiresAt = workerData?.planExpiresAt
        setPlanExpiresAtValue(
          expiresAt
            ? (typeof expiresAt?.toDate === 'function' ? expiresAt.toDate() : new Date(expiresAt))
                .toISOString()
                .slice(0, 10)
            : ''
        )
        const [available, reviewsData, paymentsData, amount] = await Promise.all([
          getUserAvailability(workerData?.userId),
          getWorkerReviews(workerId),
          getWorkerPayments(workerId),
          getWorkerSubscriptionAmount(),
        ])
        setIsAvailable(available)
        setReviews(reviewsData)
        setVisibleReviewsCount(PAGE_SIZE)
        setPayments(paymentsData)
        setSubscriptionAmount(amount)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [workerId])

  const paymentStatus = worker
    ? computeWorkerPaymentStatus(
        worker.suspendedByAdmin ? { ...worker, status: 'approved' } : worker,
        payments
      )
    : null

  const handleRecordPayment = async (amount, paidAt, monthsCovered) => {
    try {
      await recordWorkerPayment(workerId, amount, paidAt, monthsCovered)
      const refreshed = await getWorkerPayments(workerId)
      setPayments(refreshed)
      notify('Paiement enregistré', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleSavePlan = async () => {
    setSavingPlan(true)
    try {
      await updateWorkerPlan(workerId, planValue, planExpiresAtValue || null)
      setWorker((prev) => ({ ...prev, plan: planValue, planExpiresAt: planExpiresAtValue || null }))
      notify('Plan mis à jour avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSavingPlan(false)
  }

  const handleToggleBlock = async () => {
    const nextAvailable = !isAvailable
    try {
      await desableUser(worker.userId, !nextAvailable)
      await desableUserFirestore(worker.userId, nextAvailable)

      if (nextAvailable) {
        await restoreWorkerVisibility(workerId)
      } else {
        await hideWorkerFromPublic(workerId)
      }

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

        <RecordPaymentModal
          open={paymentModalOpen}
          setOpen={setPaymentModalOpen}
          defaultAmount={subscriptionAmount}
          onConfirm={handleRecordPayment}
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

        {/* Abonnement */}
        {(worker.status === 'approved' || worker.suspendedByAdmin) && paymentStatus && (
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

        {/* Plan payant (badge Pro/Premium sur le site public) */}
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <RiVipCrownLine className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">
              Plan
            </h2>
          </div>
          <p className="mb-4 text-xs text-gray-500">
            Détermine le badge affiché sur le profil public (distinct de l'abonnement de
            référencement ci-dessus).
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Plan
              </label>
              <select
                value={planValue}
                onChange={(e) => setPlanValue(e.target.value)}
                className="rounded-2xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="free">Gratuit</option>
                <option value="pro">Pro</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                Expire le (optionnel)
              </label>
              <input
                type="date"
                value={planExpiresAtValue}
                onChange={(e) => setPlanExpiresAtValue(e.target.value)}
                className="rounded-2xl border-0 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleSavePlan}
              disabled={savingPlan}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-60"
              style={{ backgroundColor: colors.primary }}
            >
              {savingPlan ? <Loader /> : 'Enregistrer'}
            </button>
          </div>
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
  <Page name="Ouvrier | BâtiMoo Admin">
    <WorkerDetail />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'workers'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(WorkerDetailPage)
