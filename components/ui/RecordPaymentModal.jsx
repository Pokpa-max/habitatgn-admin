import { useEffect, useState } from 'react'
import { RiMoneyDollarCircleLine } from 'react-icons/ri'
import Loader from '@/components/Loader'
import AdminModal, { ModalButton } from '@/components/ui/AdminModal'

const todayInputValue = () => new Date().toISOString().slice(0, 10)
const inputClass =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

/**
 * Enregistrement manuel d'un paiement de formule Pro (agent ou artisan).
 * `who` : « l'agent » / « l'artisan », pour les textes d'aide.
 */
export default function RecordPaymentModal({ open, setOpen, defaultAmount, onConfirm, who = 'le professionnel' }) {
  const [monthsCovered, setMonthsCovered] = useState(1)
  const [amount, setAmount] = useState(defaultAmount || '')
  const [paidAt, setPaidAt] = useState(todayInputValue())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setMonthsCovered(1)
      setAmount(defaultAmount || '')
      setPaidAt(todayInputValue())
    }
  }, [open, defaultAmount])

  const handleMonthsChange = (value) => {
    const months = Math.max(1, Number(value) || 1)
    setMonthsCovered(months)
    setAmount(defaultAmount ? String(Number(defaultAmount) * months) : amount)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onConfirm(Number(amount) || 0, new Date(paidAt), Number(monthsCovered) || 1)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={() => setOpen(false)}
      size="sm"
      icon={RiMoneyDollarCircleLine}
      eyebrow="Formule Pro"
      title="Enregistrer un paiement"
      footer={
        <>
          <ModalButton onClick={() => setOpen(false)}>Annuler</ModalButton>
          <ModalButton variant="primary" type="submit" form="record-payment-form" disabled={saving}>
            {saving ? <Loader /> : 'Enregistrer le paiement'}
          </ModalButton>
        </>
      }
    >
      <form id="record-payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">Nombre de mois payés</label>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={monthsCovered}
            onChange={(e) => handleMonthsChange(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500">{`${who.charAt(0).toUpperCase()}${who.slice(1)} peut payer plusieurs mois d'un coup.`}</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">Montant total reçu (GNF)</label>
          <input
            type="number"
            min="0"
            step="1000"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-900">Date du paiement</label>
          <input type="date" required value={paidAt} onChange={(e) => setPaidAt(e.target.value)} className={inputClass} />
        </div>
        <p className="rounded-xl bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
          Le badge Pro et la place en tête de liste sont prolongés automatiquement de la durée payée.
        </p>
      </form>
    </AdminModal>
  )
}
