import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiAddLine, RiCheckLine, RiToolsLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import Loader from '@/components/Loader'
import DrawerForm from '@/components/DrawerForm'
import { getManagedProperties, getPropertiesByOwner } from '@/lib/services/managedProperties'
import {
  getMaintenanceTickets,
  addMaintenanceTicket,
  editMaintenanceTicket,
} from '@/lib/services/maintenanceTickets'

const CATEGORIES = ['Plomberie', 'Électricité', 'Peinture', 'Autre']

const STATUS_CONFIG = {
  ouvert: { label: 'Ouvert', bg: '#FEE2E2', color: '#991B1B' },
  en_cours: { label: 'En cours', bg: '#FEF3C7', color: '#92400E' },
  résolu: { label: 'Résolu', bg: '#D1FAE5', color: '#065F46' },
}

export default function EntretienTab({ ownerId }) {
  const colors = useColors()
  const [tickets, setTickets] = useState([])
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  const resolveForm = useForm({ mode: 'onBlur' })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [ticketsData, propertiesData] = await Promise.all([
          getMaintenanceTickets(),
          ownerId ? getPropertiesByOwner(ownerId) : getManagedProperties(),
        ])
        const propertyIds = new Set(propertiesData.map((p) => p.id))
        setTickets(ownerId ? ticketsData.filter((t) => propertyIds.has(t.propertyId)) : ticketsData)
        setProperties(propertiesData)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [ownerId])

  const propertyById = (id) => properties.find((p) => p.id === id)

  const openAdd = () => {
    reset({
      propertyId: properties[0]?.id || '',
      title: '',
      description: '',
      category: 'Plomberie',
      reportedDate: new Date().toISOString().slice(0, 10),
    })
    setDrawerOpen(true)
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        propertyId: data.propertyId,
        title: data.title,
        description: data.description,
        category: data.category,
        reportedDate: data.reportedDate,
        status: 'ouvert',
        cost: 0,
        resolvedDate: null,
      }
      const saved = await addMaintenanceTicket(payload)
      setTickets((prev) => [saved, ...prev])
      notify('Ticket créé avec succès', 'success')
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const startProgress = async (ticket) => {
    try {
      await editMaintenanceTicket(ticket.id, { status: 'en_cours' })
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: 'en_cours' } : t)))
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const openResolve = (ticket) => {
    resolveForm.reset({ cost: '', resolvedDate: new Date().toISOString().slice(0, 10) })
    setResolvingId(ticket.id)
  }

  const submitResolve = async (ticket, data) => {
    try {
      const payload = { status: 'résolu', cost: Number(data.cost) || 0, resolvedDate: data.resolvedDate }
      await editMaintenanceTicket(ticket.id, payload)
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, ...payload } : t)))
      setResolvingId(null)
      notify('Ticket résolu', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filtered = tickets.filter((t) => statusFilter === 'all' || t.status === statusFilter)

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Entretien & pannes</h2>
            <p className="mt-1 text-sm text-gray-500">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="ouvert">Ouvert</option>
              <option value="en_cours">En cours</option>
              <option value="résolu">Résolu</option>
            </select>
            <button
              onClick={openAdd}
              disabled={properties.length === 0}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              <RiAddLine className="h-4 w-4" />
              Signaler un problème
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiToolsLine className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-400">Aucun ticket</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => {
              const property = propertyById(ticket.propertyId)
              const statusCfg = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.ouvert
              return (
                <div key={ticket.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{ticket.title}</p>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {property?.reference} — {property?.address} · {ticket.category}
                      </p>
                      {ticket.description && <p className="mt-1 text-sm text-gray-600">{ticket.description}</p>}
                      <p className="mt-1 text-xs text-gray-400">
                        Signalé le {ticket.reportedDate ? firebaseDateFormat(new Date(ticket.reportedDate)) : '—'}
                        {ticket.status === 'résolu' && (
                          <>
                            {' · Résolu le '}
                            {firebaseDateFormat(new Date(ticket.resolvedDate))}
                            {' · '}
                            {formatGNF(ticket.cost)}
                          </>
                        )}
                      </p>
                    </div>

                    {ticket.status !== 'résolu' && (
                      <div className="flex shrink-0 items-center gap-2">
                        {ticket.status === 'ouvert' && (
                          <button
                            onClick={() => startProgress(ticket)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Prendre en charge
                          </button>
                        )}
                        <button
                          onClick={() => openResolve(ticket)}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                          style={{ backgroundColor: colors.primary }}
                        >
                          Marquer résolu
                        </button>
                      </div>
                    )}
                  </div>

                  {resolvingId === ticket.id && (
                    <form
                      onSubmit={resolveForm.handleSubmit((data) => submitResolve(ticket, data))}
                      className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4"
                    >
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700">
                          Coût de la réparation (GNF)
                        </label>
                        <input
                          type="number"
                          {...resolveForm.register('cost')}
                          className="w-40 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700">
                          Date de résolution
                        </label>
                        <input
                          type="date"
                          {...resolveForm.register('resolvedDate', { required: true })}
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg px-4 py-2 text-xs font-semibold text-white"
                        style={{ backgroundColor: colors.primary }}
                      >
                        Confirmer
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolvingId(null)}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                      >
                        Annuler
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title="Signaler un problème"
        description="Créer un nouveau ticket d'entretien"
        footerButtons={
          <>
            {saving ? (
              <div
                className="inline-flex justify-center rounded px-6 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: colors.primary }}
              >
                <Loader />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => setDrawerOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center gap-2 rounded px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
                  style={{ backgroundColor: colors.primary }}
                >
                  <RiCheckLine className="h-4 w-4" />
                  Enregistrer
                </button>
              </>
            )}
          </>
        }
      >
        <div className="space-y-5 px-6 py-6 sm:p-8">
          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Bien *
            </label>
            <select
              {...register('propertyId', { required: 'Requis' })}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.address}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Titre *
            </label>
            <input
              type="text"
              {...register('title', { required: 'Requis' })}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              placeholder="Ex: Fuite d'eau salle de bain"
            />
            {errors.title && <p className="mt-1 text-xs font-semibold text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                Catégorie
              </label>
              <select
                {...register('category')}
                className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
                Date de signalement *
              </label>
              <input
                type="date"
                {...register('reportedDate', { required: 'Requis' })}
                className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold uppercase tracking-wide text-gray-700">
              Description
            </label>
            <textarea
              rows={3}
              {...register('description')}
              className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>
      </DrawerForm>
    </>
  )
}
