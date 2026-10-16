import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  RiPhoneLine,
  RiMailLine,
  RiSearchLine,
  RiInboxLine,
  RiCloseLine,
  RiWhatsappLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import PaginationButton from '@/components/Orders/PaginationButton'
import StatusPill from '@/components/ui/StatusPill'
import { firebaseDateFormat } from '@/utils/date'
import { REQUEST_STATUSES } from './statusConfig'
import { useCanManage } from '@/hooks/useCanManage'

const PAGE_SIZE = 10

/** Lien WhatsApp : numéro guinéen à 9 chiffres complété de l'indicatif 224. */
/** Date saisie « 2026-10-25 » -> « 25 oct. 2026 » ; autre valeur inchangée. */
const readableValue = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(`${value}T12:00:00`)
  return isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const whatsappUrl = (phone) => {
  const digits = String(phone || '').replace(/[^0-9]/g, '')
  if (!digits) return null
  return `https://wa.me/${digits.length === 9 ? `224${digits}` : digits}`
}

function DetailModal({ request, open, setOpen, detailFields, onStatusChange, canProcess, serviceTitle }) {
  const colors = useColors()
  const [updating, setUpdating] = useState(false)
  if (!request) return null

  const currentStatus = request.status || 'pending'
  const statusMeta = REQUEST_STATUSES.find((s) => s.value === currentStatus) || REQUEST_STATUSES[0]
  const change = async (status) => {
    setUpdating(true)
    await onStatusChange(request, status)
    setUpdating(false)
  }

  // Champs renseignés uniquement ; la description occupe toute la largeur
  const fields = detailFields
    .map((f) => ({ label: f.label, value: readableValue(f.render ? f.render(request) : request[f.accessor]), long: f.accessor === 'description' }))
    .filter((f) => f.value)
  const shortFields = fields.filter((f) => !f.long)
  const longFields = fields.filter((f) => f.long)
  const whatsapp = whatsappUrl(request.phone)

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setOpen}>
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

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-t-2xl bg-white text-left shadow-2xl transition-all sm:rounded-2xl">
                {/* En-tête : service, client, statut */}
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
                  <div className="min-w-0">
                    {serviceTitle && (
                      <p className="text-xs font-semibold" style={{ color: colors.primary }}>
                        {serviceTitle}
                      </p>
                    )}
                    <Dialog.Title className="mt-0.5 truncate text-lg font-bold text-gray-900">
                      {request.name || 'Client'}
                    </Dialog.Title>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusPill tone={statusMeta.tone}>{statusMeta.label}</StatusPill>
                      <span className="text-xs text-gray-500">
                        Reçue le {firebaseDateFormat(request.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Fermer"
                  >
                    <RiCloseLine className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[65vh] space-y-6 overflow-y-auto px-6 py-5">
                  {/* Client */}
                  <section>
                    <h3 className="mb-2.5 text-xs font-semibold text-gray-500">Client</h3>
                    <div className="space-y-1.5 text-sm text-gray-800">
                      {request.phone && (
                        <a href={`tel:${request.phone}`} className="flex items-center gap-2 hover:underline">
                          <RiPhoneLine className="h-4 w-4 text-gray-400" />
                          {request.phone}
                        </a>
                      )}
                      {request.email && (
                        <a href={`mailto:${request.email}`} className="flex items-center gap-2 hover:underline">
                          <RiMailLine className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{request.email}</span>
                        </a>
                      )}
                    </div>
                  </section>

                  {/* Détails de la demande */}
                  {fields.length > 0 && (
                    <section>
                      <h3 className="mb-2.5 text-xs font-semibold text-gray-500">Détails de la demande</h3>
                      {shortFields.length > 0 && (
                        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                          {shortFields.map((f) => (
                            <div key={f.label}>
                              <dt className="text-xs text-gray-500">{f.label}</dt>
                              <dd className="mt-0.5 text-sm font-medium text-gray-900">{f.value}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {longFields.map((f) => (
                        <div key={f.label} className="mt-4 rounded-xl bg-gray-50 p-4">
                          <p className="text-xs text-gray-500">{f.label}</p>
                          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-gray-800">{f.value}</p>
                        </div>
                      ))}
                    </section>
                  )}

                  {/* Statut */}
                  {canProcess && (
                    <section>
                      <h3 className="mb-2.5 text-xs font-semibold text-gray-500">Statut de la demande</h3>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {REQUEST_STATUSES.map((s) => {
                          const active = currentStatus === s.value
                          return (
                            <button
                              key={s.value}
                              type="button"
                              disabled={active || updating}
                              onClick={() => change(s.value)}
                              className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-default"
                              style={
                                active
                                  ? { borderColor: colors.primary, backgroundColor: colors.primary, color: '#FFFFFF' }
                                  : { borderColor: colors.gray200, color: colors.gray700, opacity: updating ? 0.6 : 1 }
                              }
                            >
                              {s.label}
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="hidden rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:inline-flex"
                  >
                    Fermer
                  </button>
                  {whatsapp && (
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <RiWhatsappLine className="h-4 w-4" style={{ color: '#25D366' }} />
                      WhatsApp
                    </a>
                  )}
                  {request.phone && (
                    <a
                      href={`tel:${request.phone}`}
                      className="order-first inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 sm:order-none"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <RiPhoneLine className="h-4 w-4" />
                      Appeler
                    </a>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default function ServiceRequestsPanel({
  title,
  description,
  fetchRequests,
  updateStatus,
  columns,
  detailFields,
  searchFn,
  searchPlaceholder,
}) {
  const colors = useColors()
  const canProcess = useCanManage('services', 'process')
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailTarget, setDetailTarget] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await fetchRequests()
        setRequests(data)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [fetchRequests])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [statusFilter, searchTerm])

  const handleStatusChange = async (request, status) => {
    if (!canProcess) return
    try {
      await updateStatus(request.id, status)
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status } : r)))
      setDetailTarget((prev) => (prev?.id === request.id ? { ...prev, status } : prev))
      notify('Statut mis à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === 'all' || (r.status || 'pending') === statusFilter
    if (!matchStatus) return false
    if (!searchTerm) return true
    const lower = searchTerm.toLowerCase()
    const base =
      r.name?.toLowerCase().includes(lower) || r.phone?.toLowerCase().includes(lower)
    return base || (searchFn ? searchFn(r, lower) : false)
  })
  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <DetailModal
        request={detailTarget}
        open={detailOpen}
        setOpen={setDetailOpen}
        detailFields={detailFields}
        onStatusChange={handleStatusChange}
        canProcess={canProcess}
        serviceTitle={title}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">{description}</p>
        <div className="relative sm:w-64">
          <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder || 'Rechercher...'}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
        {[{ value: 'all', label: 'Toutes' }, ...REQUEST_STATUSES].map((f) => {
          const count =
            f.value === 'all'
              ? requests.length
              : requests.filter((r) => (r.status || 'pending') === f.value).length
          const active = statusFilter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className="flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
              style={
                active
                  ? { borderColor: colors.primary, color: colors.primary }
                  : { borderColor: 'transparent', color: colors.gray500 }
              }
            >
              {f.label}
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={
                  active
                    ? { backgroundColor: colors.primaryVeryLight, color: colors.primary }
                    : { backgroundColor: colors.gray100, color: colors.gray500 }
                }
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader color="#111827" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
          <RiInboxLine className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">Aucune demande dans cette catégorie</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.gray50 }}>
                <tr>
                  {[
                    { label: 'Client' },
                    { label: 'Contact' },
                    ...columns.map((c) => ({ label: c.header, secondary: true })),
                    { label: 'Statut' },
                    { label: 'Actions' },
                  ].map((col) => (
                    <th
                      key={col.label}
                      scope="col"
                      className={`px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700 ${
                        col.secondary ? 'hidden lg:table-cell' : ''
                      }`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {visible.map((request) => {
                  const status = request.status || 'pending'
                  const statusLabel =
                    REQUEST_STATUSES.find((s) => s.value === status)?.label || status
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <p className="text-sm font-semibold text-gray-900">{request.name}</p>
                        <p className="mt-0.5 font-mono text-xs text-gray-400">
                          {firebaseDateFormat(request.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-3">
                        {request.phone && (
                          <p className="flex items-center gap-1 font-mono text-xs text-gray-500">
                            <RiPhoneLine className="h-3.5 w-3.5" /> {request.phone}
                          </p>
                        )}
                        {request.email && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <RiMailLine className="h-3.5 w-3.5" /> {request.email}
                          </p>
                        )}
                      </td>
                      {columns.map((c) => (
                        <td
                          key={c.header}
                          className={`hidden px-6 py-4 text-xs text-gray-600 lg:table-cell${c.mono ? ' font-mono' : ''}`}
                        >
                          {c.render(request) || '—'}
                        </td>
                      ))}
                      <td className="px-6 py-3">
                        <StatusPill tone={REQUEST_STATUSES.find((s) => s.value === status)?.tone || 'gray'}>
                          {statusLabel}
                        </StatusPill>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => {
                            setDetailTarget(request)
                            setDetailOpen(true)
                          }}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Voir
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {visibleCount < filtered.length && (
            <PaginationButton getmoreData={() => setVisibleCount((c) => c + PAGE_SIZE)} />
          )}
        </div>
      )}
    </div>
  )
}
