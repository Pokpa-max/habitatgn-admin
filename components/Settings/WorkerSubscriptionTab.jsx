import { useEffect, useState } from 'react'
import { RiCheckLine, RiInformationLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import {
  getWorkerSubscriptionAmount,
  setWorkerSubscriptionAmount,
  TRIAL_MONTHS,
} from '@/lib/services/workerPayments'

export default function WorkerSubscriptionTab() {
  const colors = useColors()
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const current = await getWorkerSubscriptionAmount()
        setAmount(current ? String(current) : '')
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await setWorkerSubscriptionAmount(amount)
      notify('Montant mis à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader color="#111827" />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Abonnement ouvriers</h2>
        <p className="mt-1 text-sm text-gray-500">
          Montant mensuel facturé à chaque ouvrier une fois son profil approuvé et sa période
          d'essai terminée
        </p>
      </div>

      <div
        className="mb-6 flex items-start gap-2.5 rounded-lg p-3 text-sm"
        style={{ backgroundColor: colors.primaryVeryLight, color: colors.primaryDark }}
      >
        <RiInformationLine className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          Chaque ouvrier bénéficie de {TRIAL_MONTHS} mois d'essai gratuit à compter de la
          validation de son profil, puis doit régler ce montant chaque mois pour rester
          référencé. Les paiements se saisissent manuellement depuis la fiche de l'ouvrier.
        </p>
      </div>

      <div className="max-w-xs">
        <label className="mb-2 block text-sm font-semibold text-gray-900">
          Montant mensuel (GNF)
        </label>
        <input
          type="number"
          min="0"
          step="1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Ex: 50000"
          className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mt-6 flex justify-end">
        {saving ? (
          <div
            className="inline-flex justify-center rounded-lg px-6 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: colors.primary }}
          >
            <Loader />
          </div>
        ) : (
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
            style={{ backgroundColor: colors.primary }}
          >
            <RiCheckLine className="h-4 w-4" />
            Enregistrer
          </button>
        )}
      </div>
    </form>
  )
}
