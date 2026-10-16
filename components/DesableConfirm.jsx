import { RiCheckLine, RiForbidLine } from 'react-icons/ri'
import AdminModal, { ModalButton } from '@/components/ui/AdminModal'

/**
 * Confirmation de blocage / déblocage d'un compte.
 * desable = true : on bloque (bouton rouge) ; false : on réactive.
 */
function DesableConfirmModal({ title, open, setOpen, confirmFunction, desable, message }) {
  return (
    <AdminModal
      open={open}
      onClose={() => setOpen(false)}
      size="sm"
      icon={desable ? RiForbidLine : RiCheckLine}
      tone={desable ? 'error' : 'primary'}
      title={title}
      footer={
        <>
          <ModalButton onClick={() => setOpen(false)}>Annuler</ModalButton>
          <ModalButton
            variant={desable ? 'danger' : 'primary'}
            icon={desable ? RiForbidLine : RiCheckLine}
            onClick={() => confirmFunction()}
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
