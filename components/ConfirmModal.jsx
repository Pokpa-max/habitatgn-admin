import { useState } from 'react'
import { RiErrorWarningLine } from 'react-icons/ri'
import AdminModal, { ModalButton } from '@/components/ui/AdminModal'

/**
 * Confirmation avant une action (le plus souvent une suppression).
 * « Confirmer » appelle confirmFunction (l'appelant ferme la fenêtre) ;
 * « Annuler », la croix ou un clic à côté la ferment.
 */
function ConfirmModal({
  title = 'Voulez-vous continuer ?',
  description = 'Appuyez sur « Confirmer » pour continuer.',
  open,
  setOpen,
  confirmFunction = () => {},
  cancelFuction = () => {},
  confirmLabel = 'Confirmer',
  tone = 'error',
  /** Texte à recopier pour activer « Confirmer » (actions irréversibles) */
  confirmText = '',
}) {
  const [busy, setBusy] = useState(false)
  const [typed, setTyped] = useState('')
  const normalize = (v) => String(v || '').trim().replace(/\s+/g, ' ').toLowerCase()
  const blocked = Boolean(confirmText) && normalize(typed) !== normalize(confirmText)
  const close = () => {
    if (busy) return
    setTyped('')
    cancelFuction()
    setOpen(false)
  }
  const confirm = async () => {
    if (blocked) return
    setBusy(true)
    try {
      await confirmFunction()
    } finally {
      setBusy(false)
      setTyped('')
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={close}
      size="sm"
      icon={RiErrorWarningLine}
      tone={tone}
      title={title}
      footer={
        <>
          <ModalButton onClick={close} disabled={busy}>Annuler</ModalButton>
          <ModalButton variant={tone === 'error' ? 'danger' : 'primary'} loading={busy} disabled={blocked} onClick={confirm}>
            {confirmLabel}
          </ModalButton>
        </>
      }
    >
      {description && <p className="text-sm leading-relaxed text-gray-600">{description}</p>}
      {confirmText && (
        <label className="mt-4 block text-sm text-gray-700">
          Pour confirmer, tapez <span className="font-semibold text-gray-900">{confirmText}</span>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </label>
      )}
    </AdminModal>
  )
}

export default ConfirmModal
