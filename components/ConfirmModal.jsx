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
}) {
  const [busy, setBusy] = useState(false)
  const close = () => {
    if (busy) return
    cancelFuction()
    setOpen(false)
  }
  const confirm = async () => {
    setBusy(true)
    try {
      await confirmFunction()
    } finally {
      setBusy(false)
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
          <ModalButton variant={tone === 'error' ? 'danger' : 'primary'} loading={busy} onClick={confirm}>
            {confirmLabel}
          </ModalButton>
        </>
      }
    >
      {description && <p className="text-sm leading-relaxed text-gray-600">{description}</p>}
    </AdminModal>
  )
}

export default ConfirmModal
