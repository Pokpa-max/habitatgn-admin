import React, { useRef } from 'react'
import { RiBillFill } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { firebaseDateHour } from '../../utils/date'
import Modal from '../Modal'

const DETAIL_ROWS = [
  { label: 'Mode de paiement', accessor: 'method', badge: true },
  { label: 'Reference', accessor: 'reference' },
  { label: 'Source', accessor: 'source' },
  { label: 'Montant', accessor: 'amount' },
  { label: 'Date', accessor: 'date' },
]

function PaymentDetailsModal({ open, setOpen, order }) {
  const colors = useColors()
  const cancelButtonRef = useRef(null)

  const values = {
    method: 'Ecobank pay',
    reference: '00TUNG444MGHM/NJTRTY',
    source: 'ACC-342214507',
    amount: 'GNF 779 000',
    date: firebaseDateHour(order?.createdAt),
  }

  return (
    <Modal open={open} setOpen={setOpen} cancelButtonRef={cancelButtonRef}>
      <div className="relative inline-block w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:align-middle">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: colors.primaryVeryLight }}
          >
            <RiBillFill className="h-5 w-5" style={{ color: colors.primary }} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Détails du paiement</p>
            <p className="text-xs text-gray-400">rerERykjfbHKVBHVG977</p>
          </div>
        </div>
        <div className="space-y-2.5 px-6 py-5">
          {DETAIL_ROWS.map((row) => (
            <div key={row.accessor} className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{row.label}</p>
              {row.badge ? (
                <p
                  className="w-min whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold uppercase"
                  style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                >
                  {values[row.accessor]}
                </p>
              ) : (
                <p className="text-sm font-medium text-gray-700">{values[row.accessor]}</p>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
            ref={cancelButtonRef}
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PaymentDetailsModal
