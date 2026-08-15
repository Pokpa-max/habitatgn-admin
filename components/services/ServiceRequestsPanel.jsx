import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  RiPhoneLine,
  RiMailLine,
  RiMore2Fill,
  RiSearchLine,
  RiInboxLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import PaginationButton from '@/components/Orders/PaginationButton'
import { firebaseDateFormat } from '@/utils/date'
import { REQUEST_STATUSES } from './statusConfig'

const PAGE_SIZE = 10

function DetailModal({ request, open, setOpen, detailFields, onStatusChange }) {
  const colors = useColors()
  const [updating, setUpdating] = useState(false)
  if (!request) return null

  const change = async (status) => {
    setUpdating(true)
    await onStatusChange(request, status)
    setUpdating(false)
  }

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all">
                <div className="border-b border-gray-100 px-6 py-5">
                  <Dialog.Title className="text-sm font-bold text-gray-900">
                    {request.name}
                  </Dialog.Title>
                  <p className="mt-0.5 text-xs text-gray-500">Détail de la demande</p>
                </div>

                <div className="max-h-96 overflow-y-auto p-5">
                  <div className="space-y-2.5">
                    {detailFields.map((f) => {
                      const value = f.render ? f.render(request) : request[f.accessor]
                      if (!value) return null
                      return (
                        <div key={f.label} className="text-sm">
                          <span className="font-semibold text-gray-500">{f.label} </span>
                          <span className="text-gray-800">{value}</span>
                        </div>
                      )
                    })}
                    <div className="text-sm">
                      <span className="font-semibold text-gray-500">Demande reçue </span>
                      <span className="text-gray-800">{firebaseDateFormat(request.createdAt)}</span>
                    </div>
                  </div>

                  <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Changer le statut
                  </p>
                  <div className="space-y-1">
                    {REQUEST_STATUSES.map((s) => {
                      const active = (request.status || 'pending') === s.value
                      return (
                        <button
                          key={s.value}
                          disabled={active || updating}
                          onClick={() => change(s.value)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: active ? colors.primary : colors.gray300 }}
                          />
                          {s.label}
                        </button>
                      )
                    })}
                  </div>

                  {request.phone && (
                    <a
                      href={`tel:${request.phone}`}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <RiPhoneLine className="h-4 w-4" />
                      Appeler {request.name?.split(' ')[0]}
                    </a>
                  )}
                </div>

                <div className="border-t border-gray-100 bg-gray-50/80 p-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100"
                  >
                    Fermer
                  </button>
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
  description,
  fetchRequests,
  updateStatus,
  columns,
  detailFields,
  searchFn,
  searchPlaceholder,
}) {
  const colors = useColors()
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
                  {['Client', 'Contact', ...columns.map((c) => c.header), 'Statut', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {visible.map((request) => {
                  const status = request.status || 'pending'
                  const statusLabel =
                    REQUEST_STATUSES.find((s) => s.value === status)?.label || status
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900">{request.name}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {firebaseDateFormat(request.createdAt)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {request.phone && (
                          <p className="flex items-center gap-1 text-xs text-gray-500">
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
                        <td key={c.header} className="px-6 py-4 text-xs text-gray-600">
                          {c.render(request) || '—'}
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                status === 'cancelled'
                                  ? colors.gray400
                                  : status === 'completed'
                                  ? colors.primary
                                  : colors.gray700,
                            }}
                          />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setDetailTarget(request)
                            setDetailOpen(true)
                          }}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                          title="Détail"
                        >
                          <RiMore2Fill className="h-4 w-4" />
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
