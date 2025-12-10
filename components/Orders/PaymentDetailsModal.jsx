import React, { useRef } from 'react'
import { RiBillFill } from 'react-icons/ri'
import { firebaseDateHour } from '../../utils/date'
import Modal from '../Modal'

function PaymentDetailsModal({ open, setOpen, order }) {
  const cancelButtonRef = useRef(null)

  return (
    <Modal open={open} setOpen={setOpen} cancelButtonRef={cancelButtonRef}>
      <div className="rounded-xs relative inline-block w-3/12 transform space-y-4 overflow-hidden bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:p-5 sm:align-middle">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <div className="rounded-full bg-gray-100 p-2">
            <RiBillFill className="text-gray-400" />
          </div>
          <div className="">
            <p className="text-sm text-gray-500">Details du paiement</p>
            <p className="text-xs text-gray-400">rerERykjfbHKVBHVG977</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between ">
            <p className="text-sm text-gray-500">Mode de paiement</p>
            <p className="w-min whitespace-nowrap rounded-full bg-sky-100 px-2 py-1 text-xs uppercase text-sky-500">
              Ecobank pay
            </p>
          </div>
          <div className="flex items-center justify-between ">
            <p className="text-sm text-gray-500">Reference</p>
            <p className="text-sm text-gray-700">00TUNG444MGHM/NJTRTY</p>
          </div>
          <div className="flex items-center justify-between ">
            <p className="text-sm text-gray-500">Source</p>
            <p className="text-sm text-gray-700">ACC-342214507</p>
          </div>
          <div className="flex items-center justify-between ">
            <p className="text-sm text-gray-500">Montant</p>
            <p className="text-sm text-gray-700">GNF 779 000</p>
          </div>
          <div className="flex items-center justify-between ">
            <p className="text-sm text-gray-500">Date</p>
            <p className="text-sm text-gray-700">
              {firebaseDateHour(order?.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default PaymentDetailsModal
