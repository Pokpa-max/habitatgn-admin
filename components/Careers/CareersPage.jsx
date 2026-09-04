import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  RiBriefcaseLine,
  RiSearchLine,
  RiUserLine,
  RiPhoneLine,
  RiMailLine,
  RiLinksLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import StatusPill from '@/components/ui/StatusPill'
import PaginationButton from '@/components/Orders/PaginationButton'
import { firebaseDateFormat } from '@/utils/date'
import {
  getAllCareerApplications,
  updateCareerApplicationStatus,
} from '@/lib/services/careerApplications'
import { useCanManage } from '@/hooks/useCanManage'

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'Nouvelle' },
  { value: 'reviewed', label: 'Étudiée' },
  { value: 'interview', label: 'Entretien' },
  { value: 'hired', label: 'Retenue' },
  { value: 'rejected', label: 'Refusée' },
]

const STATUS_CONFIG = {
  pending: { label: 'Nouvelle', tone: 'primary' },
  reviewed: { label: 'Étudiée', tone: 'gray' },
  interview: { label: 'Entretien', tone: 'warning' },
  hired: { label: 'Retenue', tone: 'success' },
  rejected: { label: 'Refusée', tone: 'error' },
}

function ApplicationDetailDrawer({ application, open, setOpen, onStatusChange, updating, canProcess }) {
  const colors = useColors()
  if (!application) return null

  const statusCfg = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all">
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Dialog.Title className="text-sm font-bold text-gray-900">
                        {application.name}
                      </Dialog.Title>
                      <p className="mt-0.5 text-xs text-gray-500">{application.position}</p>
                    </div>
                    <StatusPill tone={statusCfg.tone}>{statusCfg.label}</StatusPill>
                  </div>
                </div>

                <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-1.5 text-gray-800">
                      <RiUserLine className="h-3.5 w-3.5 text-gray-400" />
                      {application.name}
                    </p>
                    <p className="flex items-center gap-1.5 font-mono text-gray-600">
                      <RiPhoneLine className="h-3.5 w-3.5 text-gray-400" />
                      {application.phone}
                    </p>
                    <p className="flex items-center gap-1.5 text-gray-600">
                      <RiMailLine className="h-3.5 w-3.5 text-gray-400" />
                      {application.email}
                    </p>
                    {application.portfolioUrl && (
                      <p className="flex items-center gap-1.5 text-gray-600">
                        <RiLinksLine className="h-3.5 w-3.5 text-gray-400" />
                        <a
                          href={application.portfolioUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate underline"
                          style={{ color: colors.primary }}
                        >
                          {application.portfolioUrl}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={`tel:${application.phone}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <RiPhoneLine className="h-4 w-4" />
                      Appeler
                    </a>
                    <a
                      href={`mailto:${application.email}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
                      style={{ borderColor: colors.primary, color: colors.primary }}
                    >
                      <RiMailLine className="h-4 w-4" />
                      Email
                    </a>
                  </div>

                  {application.message && (
                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Message de présentation
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                        {application.message}
                      </p>
                    </div>
                  )}

                  <p className="mt-4 font-mono text-xs text-gray-400">
                    Candidature reçue le {firebaseDateFormat(application.createdAt)}
                  </p>

                  {canProcess && (
                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Changer le statut
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.filter((f) => f.value !== 'all').map((f) => {
                          const active = application.status === f.value
                          return (
                            <button
                              key={f.value}
                              disabled={active || updating}
                              onClick={() => onStatusChange(application, f.value)}
                              className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed"
                              style={
                                active
                                  ? { borderColor: colors.primary, backgroundColor: colors.primaryVeryLight, color: colors.primary }
                                  : { borderColor: colors.gray200, color: colors.gray600 }
                              }
                            >
                              {f.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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

export default function CareersPage() {
  const colors = useColors()
  const canProcess = useCanManage('careers', 'process')
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailApplication, setDetailApplication] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  // Sélection multiple / actions groupées
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkActing, setBulkActing] = useState(false)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [statusFilter, searchTerm])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [statusFilter, searchTerm])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const data = await getAllCareerApplications()
      setApplications(data)
    } catch (err) {
      console.error(err)
      notify('Erreur lors du chargement des candidatures', 'error')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleStatusChange = async (application, status) => {
    if (!canProcess) return
    setUpdatingId(application.id)
    try {
      await updateCareerApplicationStatus(application.id, status)
      setApplications((prev) =>
        prev.map((a) => (a.id === application.id ? { ...a, status } : a))
      )
      setDetailApplication((prev) => (prev?.id === application.id ? { ...prev, status } : prev))
      notify('Statut mis à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setUpdatingId(null)
  }

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const matchStatus = statusFilter === 'all' || (a.status || 'pending') === statusFilter
      if (!matchStatus) return false
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      return (
        a.name?.toLowerCase().includes(q) ||
        a.position?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q)
      )
    })
  }, [applications, statusFilter, searchTerm])

  const visible = filtered.slice(0, visibleCount)

  const selectableIds = canProcess ? visible.map((a) => a.id) : []
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(selectableIds))
  }

  const handleBulkStatus = async (status) => {
    if (!canProcess) return
    const targets = applications.filter((a) => selectedIds.has(a.id))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      await Promise.all(targets.map((a) => updateCareerApplicationStatus(a.id, status)))
      const targetIds = new Set(targets.map((a) => a.id))
      setApplications((prev) =>
        prev.map((a) => (targetIds.has(a.id) ? { ...a, status } : a))
      )
      notify(
        `${targets.length} candidature${targets.length > 1 ? 's' : ''} mise${targets.length > 1 ? 's' : ''} à jour`,
        'success'
      )
      setSelectedIds(new Set())
    } catch (e) {
      notify('Erreur lors de la mise à jour groupée', 'error')
    }
    setBulkActing(false)
  }

  return (
    <div className="mx-auto px-4 py-6 sm:px-6 md:px-8">
      <ApplicationDetailDrawer
        application={detailApplication}
        open={detailOpen}
        setOpen={setDetailOpen}
        onStatusChange={handleStatusChange}
        updating={updatingId === detailApplication?.id}
        canProcess={canProcess}
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Carrières</h2>
            <p className="mt-1 text-sm text-gray-500">Candidatures reçues via le site public</p>
          </div>
          <div className="relative sm:w-64">
            <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher nom, poste, email..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === 'all'
                ? applications.length
                : applications.filter((a) => (a.status || 'pending') === f.value).length
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

        {/* Actions groupées */}
        {selectedIds.size > 0 && (
          <div
            className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: colors.primary, backgroundColor: colors.primaryVeryLight }}
          >
            <span className="text-sm font-semibold" style={{ color: colors.primary }}>
              {selectedIds.size} candidature{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
            </span>
            {canProcess && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkStatus('reviewed')}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                  style={{ borderColor: colors.success, color: colors.success, backgroundColor: 'transparent' }}
                >
                  Marquer étudiée
                </button>
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkStatus('rejected')}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                  style={{ borderColor: colors.error, color: colors.error, backgroundColor: 'transparent' }}
                >
                  Marquer refusée
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiBriefcaseLine className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">Aucune candidature dans cette catégorie</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>
                    <th scope="col" className="w-8 px-4 py-2.5">
                      {selectableIds.length > 0 && (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 cursor-pointer rounded"
                          style={{ accentColor: colors.primary }}
                          title="Tout sélectionner"
                        />
                      )}
                    </th>
                    {[
                      { label: 'Candidat' },
                      { label: 'Poste' },
                      { label: 'Contact' },
                      { label: 'Reçue le', secondary: true },
                      { label: 'Statut' },
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
                  {visible.map((application) => {
                    const statusCfg = STATUS_CONFIG[application.status] || STATUS_CONFIG.pending
                    return (
                      <tr
                        key={application.id}
                        onClick={() => {
                          setDetailApplication(application)
                          setDetailOpen(true)
                        }}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="w-8 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {canProcess && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(application.id)}
                              onChange={() => toggleSelect(application.id)}
                              className="h-4 w-4 cursor-pointer rounded"
                              style={{ accentColor: colors.primary }}
                            />
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                              <RiUserLine className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{application.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{application.position}</td>
                        <td className="px-6 py-3">
                          <p className="font-mono text-xs text-gray-600">{application.phone}</p>
                          <p className="text-xs text-gray-400">{application.email}</p>
                        </td>
                        <td className="hidden px-6 py-3 font-mono text-xs text-gray-500 lg:table-cell">
                          {firebaseDateFormat(application.createdAt)}
                        </td>
                        <td className="px-6 py-3">
                          <StatusPill tone={statusCfg.tone}>{statusCfg.label}</StatusPill>
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
    </div>
  )
}
