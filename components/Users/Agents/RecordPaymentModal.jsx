import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { RiMoneyDollarCircleLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import Loader from '@/components/Loader'

const todayInputValue = () => new Date().toISOString().slice(0, 10)

export default function RecordPaymentModal({ open, setOpen, defaultAmount, onConfirm }) {
  const colors = useColors()
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
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all">
                <form onSubmit={handleSubmit}>
                  <div className="px-6 pt-6 pb-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: colors.primaryVeryLight }}
                      >
                        <RiMoneyDollarCircleLine className="h-5 w-5" style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <Dialog.Title className="text-base font-bold text-gray-900">
                          Enregistrer un paiement
                        </Dialog.Title>
                        <p className="text-xs text-gray-500">Abonnement mensuel de l'agent</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                          Nombre de mois payés
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={monthsCovered}
                          onChange={(e) => handleMonthsChange(e.target.value)}
                          className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="mt-1 text-[11px] text-gray-400">
                          L'agent peut régler plusieurs mois d'avance en une seule fois
                        </p>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                          Montant total (GNF)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                          Date du paiement
                        </label>
                        <input
                          type="date"
                          required
                          value={paidAt}
                          onChange={(e) => setPaidAt(e.target.value)}
                          className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-row-reverse gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-60"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {saving ? <Loader /> : 'Confirmer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
