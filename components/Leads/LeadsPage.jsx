import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  RiPhoneLine,
  RiWhatsappLine,
  RiMore2Fill,
  RiSearchLine,
  RiDeleteBinLine,
  RiHome4Line,
  RiLandscapeLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import PaginationButton from '@/components/Orders/PaginationButton'
import ConfirmModal from '@/components/ConfirmModal'
import StatusPill from '@/components/ui/StatusPill'
import { firebaseDateFormat } from '@/utils/date'
import { getLeads, updateLeadStatus, deleteLead } from '@/lib/services/leads'

const PAGE_SIZE = 10

const FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'new', label: 'Nouvelles' },
  { value: 'contacted', label: 'Contactées' },
  { value: 'closed', label: 'Clôturées' },
]

const STATUS_META = {
  new: { label: 'Nouveau', tone: 'warning' },
  contacted: { label: 'Contacté', tone: 'primary' },
  closed: { label: 'Clôturé', tone: 'success' },
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.new
  return (
    <StatusPill tone={meta.tone}>
      {meta.label}
    </StatusPill>
  )
}

function DetailModal({ lead, open, setOpen, onStatusChange, onDelete }) {
  const colors = useColors()
  if (!lead) return null

  const telHref = lead.phone ? `tel:${lead.phone.replace(/\s+/g, '')}` : null
  const waHref = lead.phone
    ? `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`
    : null

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
                    {lead.listingTitle}
                  </Dialog.Title>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {lead.name} · {firebaseDateFormat(lead.createdAt)}
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto p-5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={lead.status} />
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: colors.gray100, color: colors.gray600 }}
                    >
                      {lead.listingType === 'lands' ? (
                        <RiLandscapeLine className="h-3.5 w-3.5" />
                      ) : (
                        <RiHome4Line className="h-3.5 w-3.5" />
                      )}
                      {lead.listingType === 'lands' ? 'Terrain' : 'Bien immobilier'}
                    </span>
                  </div>

                  <p className="mt-4 flex items-center gap-1.5 text-sm text-gray-600">
                    <RiPhoneLine className="h-3.5 w-3.5 text-gray-400" /> {lead.phone}
                  </p>

                  {lead.message && (
                    <p className="mt-4 whitespace-pre-wrap text-sm text-gray-800">
                      {lead.message}
                    </p>
                  )}

                  <div className="mt-5 flex flex-col gap-2">
                    {telHref && (
                      <a
                        href={telHref}
                        className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <RiPhoneLine className="h-4 w-4" />
                        Appeler {lead.name}
                      </a>
                    )}
                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
                        style={{ backgroundColor: '#25D366' }}
                      >
                        <RiWhatsappLine className="h-4 w-4" />
                        WhatsApp
                      </a>
                    )}

                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={lead.status === 'contacted'}
                        onClick={() => onStatusChange(lead, 'contacted')}
                        className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: colors.primary, color: colors.primary }}
                      >
                        Marquer contacté
                      </button>
                      <button
                        type="button"
                        disabled={lead.status === 'closed'}
                        onClick={() => onStatusChange(lead, 'closed')}
                        className="rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: colors.success, color: colors.success }}
                      >
                        Clôturer
                      </button>
                    </div>

                    <button
                      onClick={() => onDelete(lead)}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold"
                      style={{ color: colors.gray500 }}
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                      Supprimer cette demande
                    </button>
                  </div>
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

export default function LeadsPage() {
  const colors = useColors()
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailTarget, setDetailTarget] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getLeads()
        setLeads(data)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter, searchTerm])

  const handleStatusChange = async (lead, status) => {
    try {
      await updateLeadStatus(lead.id, status)
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)))
      setDetailTarget((prev) => (prev?.id === lead.id ? { ...prev, status } : prev))
      notify('Statut mis à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteLead(deleteTarget.id)
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id))
      setDeleteTarget(null)
      setDetailOpen(false)
      notify('Demande supprimée avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filtered = leads.filter((l) => {
    const matchFilter = filter === 'all' || l.status === filter
    if (!matchFilter) return false
    if (!searchTerm) return true
    const lower = searchTerm.toLowerCase()
    return (
      l.name?.toLowerCase().includes(lower) ||
      l.phone?.toLowerCase().includes(lower) ||
      l.listingTitle?.toLowerCase().includes(lower)
    )
  })
  const visible = filtered.slice(0, visibleCount)
  const newCount = leads.filter((l) => l.status === 'new').length

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <DetailModal
        lead={detailTarget}
        open={detailOpen}
        setOpen={setDetailOpen}
        onStatusChange={handleStatusChange}
        onDelete={(l) => setDeleteTarget(l)}
      />

      <ConfirmModal
        open={!!deleteTarget}
        setOpen={() => setDeleteTarget(null)}
        title="Supprimer la demande"
        description="Êtes-vous sûr de supprimer cette demande de visite ? Cette action est irréversible."
        confirmFunction={handleDelete}
        cancelFuction={() => {}}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Demandes de visite</h2>
          <p className="mt-1 text-sm text-gray-500">
            Demandes de contact envoyées depuis les fiches de biens et terrains vers les
            agents propriétaires
            {newCount > 0 ? ` · ${newCount} nouvelle${newCount > 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div className="relative sm:w-64">
          <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, téléphone, annonce..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {FILTERS.map((f) => {
          const count =
            f.value === 'all' ? leads.length : leads.filter((l) => l.status === f.value).length
          const active = filter === f.value
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors"
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
          <RiHome4Line className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">Aucune demande dans cette catégorie</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: colors.gray50 }}>
                <tr>
                  {['Demandeur', 'Annonce', 'Reçu le', 'Statut', 'Actions'].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {visible.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-gray-500">
                        <RiPhoneLine className="h-3.5 w-3.5" /> {lead.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="max-w-xs truncate text-sm text-gray-700">
                        {lead.listingTitle}
                      </p>
                      <span
                        className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: colors.gray100, color: colors.gray600 }}
                      >
                        {lead.listingType === 'lands' ? (
                          <RiLandscapeLine className="h-3 w-3" />
                        ) : (
                          <RiHome4Line className="h-3 w-3" />
                        )}
                        {lead.listingType === 'lands' ? 'Terrain' : 'Bien'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {firebaseDateFormat(lead.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setDetailTarget(lead)
                          setDetailOpen(true)
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        title="Voir la demande"
                      >
                        <RiMore2Fill className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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
