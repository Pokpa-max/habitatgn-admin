import { useEffect, useState } from 'react'
import { RiCheckLine, RiCloseLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'

/**
 * Boutons « Approuver » / « Refuser » visibles directement sur une ligne en
 * attente. Confirmation en deux clics sur le même bouton (« Confirmer ? »),
 * annulée d'elle-même après quelques secondes : pas de fenêtre à ouvrir,
 * mais pas d'action par erreur non plus.
 */
export default function PendingDecisionButtons({ onApprove, onReject, disabled = false }) {
  const colors = useColors()
  const [armed, setArmed] = useState(null) // 'approve' | 'reject' | null

  useEffect(() => {
    if (!armed) return
    const timer = setTimeout(() => setArmed(null), 4000)
    return () => clearTimeout(timer)
  }, [armed])

  const click = (action) => {
    if (armed !== action) return setArmed(action)
    setArmed(null)
    if (action === 'approve') onApprove()
    else onReject()
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => click('approve')}
        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: armed === 'approve' ? colors.success : colors.primary }}
      >
        <RiCheckLine className="h-3.5 w-3.5" />
        {armed === 'approve' ? 'Confirmer ?' : 'Approuver'}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => click('reject')}
        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors hover:bg-gray-50 disabled:opacity-50"
        style={
          armed === 'reject'
            ? { borderColor: colors.error, color: '#FFFFFF', backgroundColor: colors.error }
            : { borderColor: colors.gray200, color: colors.gray700 }
        }
      >
        <RiCloseLine className="h-3.5 w-3.5" />
        {armed === 'reject' ? 'Confirmer ?' : 'Refuser'}
      </button>
    </div>
  )
}
