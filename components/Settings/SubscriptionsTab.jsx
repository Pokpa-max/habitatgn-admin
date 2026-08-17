import { useEffect, useState } from 'react'
import {
  RiCheckLine,
  RiInformationLine,
  RiBriefcaseLine,
  RiHammerLine,
  RiEditLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import {
  getAgentSubscriptionAmount,
  setAgentSubscriptionAmount,
  getAgentSubscriptionDescription,
  setAgentSubscriptionDescription,
  TRIAL_MONTHS as AGENT_TRIAL_MONTHS,
} from '@/lib/services/agentPayments'
import {
  getWorkerSubscriptionAmount,
  setWorkerSubscriptionAmount,
  getWorkerSubscriptionDescription,
  setWorkerSubscriptionDescription,
  TRIAL_MONTHS as WORKER_TRIAL_MONTHS,
} from '@/lib/services/workerPayments'

const formatGNF = (value) =>
  value ? `${Number(value).toLocaleString('fr-FR')} GNF / mois` : 'Non défini'

function SubscriptionCard({
  icon: Icon,
  title,
  description,
  trialMonths,
  profileLabel,
  amount,
  descriptionValue,
  onSave,
  saving,
}) {
  const colors = useColors()
  const [editing, setEditing] = useState(false)
  const [draftAmount, setDraftAmount] = useState(amount)
  const [draftDescription, setDraftDescription] = useState(descriptionValue)

  const startEditing = () => {
    setDraftAmount(amount)
    setDraftDescription(descriptionValue)
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await onSave(draftAmount, draftDescription)
    if (ok) setEditing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          </div>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RiEditLine className="h-4 w-4" />
            Modifier
          </button>
        )}
      </div>

      <div
        className="mb-6 flex items-start gap-2.5 rounded-lg p-3 text-sm"
        style={{ backgroundColor: colors.primaryVeryLight, color: colors.primaryDark }}
      >
        <RiInformationLine className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          {profileLabel} bénéficie de {trialMonths} mois d'essai gratuit à compter de la
          validation, puis doit régler ce montant chaque mois pour rester référencé. Les
          paiements se saisissent manuellement depuis sa fiche.
        </p>
      </div>

      {editing ? (
        <>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Montant mensuel (GNF)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={draftAmount}
              onChange={(e) => setDraftAmount(e.target.value)}
              placeholder="Ex: 50000"
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold text-gray-900">Description</label>
            <textarea
              rows={3}
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              placeholder="Texte décrivant cet abonnement"
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {saving ? (
              <div
                className="inline-flex justify-center rounded-lg px-6 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: colors.primary }}
              >
                <Loader />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
                  style={{ backgroundColor: colors.primary }}
                >
                  <RiCheckLine className="h-4 w-4" />
                  Enregistrer
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="rounded-2xl bg-gray-100 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500">Montant mensuel</p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{formatGNF(amount)}</p>
          </div>
          <div className="rounded-2xl bg-gray-100 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500">Description</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-900">
              {descriptionValue || '—'}
            </p>
          </div>
        </div>
      )}
    </form>
  )
}

export default function SubscriptionsTab() {
  const [isLoading, setIsLoading] = useState(true)
  const [agentAmount, setAgentAmount] = useState('')
  const [workerAmount, setWorkerAmount] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [workerDescription, setWorkerDescription] = useState('')
  const [savingAgent, setSavingAgent] = useState(false)
  const [savingWorker, setSavingWorker] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [agent, worker, agentDesc, workerDesc] = await Promise.all([
          getAgentSubscriptionAmount(),
          getWorkerSubscriptionAmount(),
          getAgentSubscriptionDescription(),
          getWorkerSubscriptionDescription(),
        ])
        setAgentAmount(agent ? String(agent) : '')
        setWorkerAmount(worker ? String(worker) : '')
        setAgentDescription(agentDesc)
        setWorkerDescription(workerDesc)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const saveAgent = async (amount, description) => {
    setSavingAgent(true)
    let ok = true
    try {
      await Promise.all([
        setAgentSubscriptionAmount(amount),
        setAgentSubscriptionDescription(description),
      ])
      setAgentAmount(amount)
      setAgentDescription(description)
      notify('Abonnement mis à jour', 'success')
    } catch (e) {
      ok = false
      notify('Une erreur est survenue', 'error')
    }
    setSavingAgent(false)
    return ok
  }

  const saveWorker = async (amount, description) => {
    setSavingWorker(true)
    let ok = true
    try {
      await Promise.all([
        setWorkerSubscriptionAmount(amount),
        setWorkerSubscriptionDescription(description),
      ])
      setWorkerAmount(amount)
      setWorkerDescription(description)
      notify('Abonnement mis à jour', 'success')
    } catch (e) {
      ok = false
      notify('Une erreur est survenue', 'error')
    }
    setSavingWorker(false)
    return ok
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader color="#111827" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SubscriptionCard
        icon={RiBriefcaseLine}
        title="Abonnement agents"
        description="Facturé à chaque agent immobilier référencé"
        trialMonths={AGENT_TRIAL_MONTHS}
        profileLabel="Chaque agent"
        amount={agentAmount}
        descriptionValue={agentDescription}
        onSave={saveAgent}
        saving={savingAgent}
      />
      <SubscriptionCard
        icon={RiHammerLine}
        title="Abonnement ouvriers"
        description="Facturé à chaque ouvrier référencé"
        trialMonths={WORKER_TRIAL_MONTHS}
        profileLabel="Chaque ouvrier"
        amount={workerAmount}
        descriptionValue={workerDescription}
        onSave={saveWorker}
        saving={savingWorker}
      />
    </div>
  )
}
