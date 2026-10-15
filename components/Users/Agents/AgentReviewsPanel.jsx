import { useEffect, useState } from 'react'
import { RiDeleteBinLine, RiStarFill } from 'react-icons/ri'
import { auth } from '@/lib/firebase/client_config'
import { useColors } from '@/contexts/ColorContext'
import ConfirmModal from '@/components/ConfirmModal'
import { notify } from '@/utils/toast'

const authHeaders = async () => {
  const token = await auth.currentUser?.getIdToken()
  return token ? { Authorization: token } : {}
}

/**
 * Avis vérifiés laissés sur l'agent depuis le site public (clients dont la
 * demande de visite a été prise en charge), avec suppression d'un avis
 * abusif. Lecture / suppression via /api/agentReviews (SDK admin).
 */
export default function AgentReviewsPanel({ agentId }) {
  const colors = useColors()
  const [reviews, setReviews] = useState(null)
  const [reviewToDelete, setReviewToDelete] = useState(null)

  useEffect(() => {
    if (!agentId) return
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(`/api/agentReviews?agentId=${encodeURIComponent(agentId)}`, {
          headers: await authHeaders(),
        })
        const data = await response.json()
        if (!cancelled) setReviews(response.ok ? data.reviews : [])
      } catch {
        if (!cancelled) setReviews([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [agentId])

  const handleDelete = async () => {
    if (!reviewToDelete) return
    try {
      const response = await fetch('/api/agentReviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ agentId, reviewId: reviewToDelete.id }),
      })
      if (!response.ok) throw new Error(String(response.status))
      setReviews((current) => (current || []).filter((r) => r.id !== reviewToDelete.id))
      notify('Avis supprimé', 'success')
    } catch {
      notify("Impossible de supprimer l'avis", 'error')
    } finally {
      setReviewToDelete(null)
    }
  }

  const average =
    reviews && reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <ConfirmModal
        open={!!reviewToDelete}
        setOpen={() => setReviewToDelete(null)}
        title="Supprimer l'avis"
        description="Êtes-vous sûr de supprimer cet avis ? Cette action est irréversible."
        confirmFunction={handleDelete}
        cancelFuction={() => {}}
      />

      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
        Avis clients ({reviews ? reviews.length : '…'})
        {average > 0 && (
          <span className="ml-2 inline-flex items-center gap-0.5 normal-case text-gray-700">
            <RiStarFill className="h-3.5 w-3.5" style={{ color: colors.primary }} />
            {average}
          </span>
        )}
      </h2>

      {reviews && reviews.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {reviews.map((review) => (
            <div key={review.id} className="flex items-start justify-between gap-4 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{review.author}</p>
                  <span className="flex items-center gap-0.5 text-xs text-gray-500">
                    <RiStarFill className="h-3.5 w-3.5" style={{ color: colors.primary }} />
                    {review.rating}
                  </span>
                  {review.listingTitle && <span className="text-xs text-gray-400">· {review.listingTitle}</span>}
                </div>
                {review.comment && <p className="mt-1 text-sm text-gray-600">{review.comment}</p>}
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
      ) : (
        <p className="text-sm text-gray-400">{reviews ? 'Aucun avis pour le moment' : 'Chargement…'}</p>
      )}
    </div>
  )
}
