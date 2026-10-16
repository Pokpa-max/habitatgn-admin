import SharedRecordPaymentModal from '@/components/ui/RecordPaymentModal'

// Paiement de formule Pro (fenêtre commune, voir components/ui/RecordPaymentModal)
export default function RecordPaymentModal(props) {
  return <SharedRecordPaymentModal {...props} who="l'agent" />
}
