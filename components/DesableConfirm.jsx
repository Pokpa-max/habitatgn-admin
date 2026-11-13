import { useState } from 'react'
import { RiCheckLine, RiForbidLine } from 'react-icons/ri'
import AdminModal, { ModalButton } from '@/components/ui/AdminModal'

/**
 * Confirmation de blocage / déblocage d'un compte.
 * desable = true : on bloque (bouton rouge) ; false : on réactive.
 */
function DesableConfirmModal({ title, open, setOpen, confirmFunction, desable, message }) {
  const [busy, setBusy] = useState(false)
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
      onClose={() => !busy && setOpen(false)}
      size="sm"
      icon={desable ? RiForbidLine : RiCheckLine}
      tone={desable ? 'error' : 'primary'}
      title={title}
      footer={
        <>
          <ModalButton onClick={() => setOpen(false)} disabled={busy}>Annuler</ModalButton>
          <ModalButton
            variant={desable ? 'danger' : 'primary'}
            icon={desable ? RiForbidLine : RiCheckLine}
            loading={busy}
            onClick={confirm}
          >
            {desable ? 'Bloquer' : 'Débloquer'}
          </ModalButton>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-gray-600">
        {message || `Voulez-vous ${desable ? 'bloquer' : 'débloquer'} ce compte ?`}
      </p>
    </AdminModal>
  )
}

export default DesableConfirmModal
