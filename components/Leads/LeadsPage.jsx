import { useEffect, useState } from 'react'
import {
  RiPhoneLine,
  RiWhatsappLine,
  RiSearchLine,
  RiDeleteBinLine,
  RiHome4Line,
  RiLandscapeLine,
  RiExternalLinkLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import PaginationButton from '@/components/Orders/PaginationButton'
import ConfirmModal from '@/components/ConfirmModal'
import StatusPill from '@/components/ui/StatusPill'
import AdminModal, { ModalButton, ModalFields, ModalNote, ModalSection, whatsappUrl } from '@/components/ui/AdminModal'
import { firebaseDateFormat } from '@/utils/date'
import { getLeads, updateLeadStatus, deleteLead } from '@/lib/services/leads'
import { useCanManage } from '@/hooks/useCanManage'

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.batimoo.com'

function DetailModal({ lead, open, setOpen, onStatusChange, onDelete, canProcess, canDelete }) {
  const colors = useColors()
  if (!lead) return null

  const isLand = lead.listingType === 'lands'
  const listingUrl = lead.listingId ? `${SITE_URL}/${isLand ? 'lands' : 'properties'}/${lead.listingId}` : null
  const whatsapp = whatsappUrl(lead.phone)

  return (
    <AdminModal
      open={open}
      onClose={() => setOpen(false)}
      eyebrow="Demande de visite"
      title={lead.name || 'Visiteur'}
      meta={
        <>
          <StatusBadge status={lead.status} />
          <span>Reçue le {firebaseDateFormat(lead.createdAt)}</span>
        </>
      }
      footer={
        <>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(lead)}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-red-600 sm:mr-auto"
            >
              <RiDeleteBinLine className="h-4 w-4" />
              Supprimer
            </button>
          )}
          {whatsapp && (
            <ModalButton href={whatsapp} external icon={RiWhatsappLine}>
              WhatsApp
            </ModalButton>
          )}
          {lead.phone && (
            <ModalButton variant="primary" href={`tel:${lead.phone.replace(/\s+/g, '')}`} icon={RiPhoneLine}>
              Appeler
            </ModalButton>
          )}
        </>
      }
    >
      <ModalSection title="Bien concerné">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: colors.gray100, color: colors.gray600 }}
            >
              {isLand ? <RiLandscapeLine className="h-4 w-4" /> : <RiHome4Line className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{lead.listingTitle || 'Annonce'}</p>
              <p className="text-xs text-gray-500">{isLand ? 'Terrain' : 'Bien immobilier'}</p>
            </div>
          </div>
          {listingUrl && (
            <a
              href={listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold"
              style={{ color: colors.primary }}
            >
              Voir l&apos;annonce
              <RiExternalLinkLine className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </ModalSection>

      <ModalSection title="Visiteur">
        <ModalFields fields={[{ label: 'Téléphone', value: lead.phone }, { label: 'Nom', value: lead.name }]} />
      </ModalSection>

      <ModalNote label="Message">{lead.message}</ModalNote>

      {canProcess && (
        <ModalSection title="Statut de la demande">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(STATUS_META).map(([value, meta]) => {
              const active = (lead.status || 'new') === value
              return (
                <button
                  key={value}
                  type="button"
                  disabled={active}
                  onClick={() => onStatusChange(lead, value)}
                  className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-default"
                  style={
                    active
                      ? { borderColor: colors.primary, backgroundColor: colors.primary, color: '#FFFFFF' }
                      : { borderColor: colors.gray200, color: colors.gray700 }
                  }
                >
                  {meta.label}
                </button>
              )
            })}
          </div>
        </ModalSection>
      )}
    </AdminModal>
  );
}

export default function LeadsPage() {
  const colors = useColors()
  const canProcess = useCanManage('leads', 'process')
  const canDelete = useCanManage('leads', 'delete')
  const [leads, setLeads] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailTarget, setDetailTarget] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Sélection multiple / actions groupées
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkActing, setBulkActing] = useState(false)
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)

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

  useEffect(() => {
    setSelectedIds(new Set())
  }, [filter, searchTerm])

  const handleStatusChange = async (lead, status) => {
    if (!canProcess) return
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
    if (!canDelete) return
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

  const selectableIds = canProcess || canDelete ? visible.map((l) => l.id) : []
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
    const targets = leads.filter((l) => selectedIds.has(l.id))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      await Promise.all(targets.map((l) => updateLeadStatus(l.id, status)))
      const targetIds = new Set(targets.map((l) => l.id))
      setLeads((prev) => prev.map((l) => (targetIds.has(l.id) ? { ...l, status } : l)))
      notify(
        `${targets.length} demande${targets.length > 1 ? 's' : ''} ${status === 'contacted' ? 'marquée(s) contactée(s)' : 'clôturée(s)'}`,
        'success'
      )
      setSelectedIds(new Set())
    } catch (e) {
      notify('Erreur lors de la mise à jour groupée', 'error')
    }
    setBulkActing(false)
  }

  const handleBulkDelete = async () => {
    if (!canDelete) return
    const targetIds = new Set(selectedIds)
    if (targetIds.size === 0) return
    setBulkActing(true)
    try {
      await Promise.all([...targetIds].map((id) => deleteLead(id)))
      setLeads((prev) => prev.filter((l) => !targetIds.has(l.id)))
      notify(`${targetIds.size} demande${targetIds.size > 1 ? 's' : ''} supprimée(s)`, 'success')
      setSelectedIds(new Set())
      setBulkDeleteModalOpen(false)
    } catch (e) {
      notify('Erreur lors de la suppression groupée', 'error')
    }
    setBulkActing(false)
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <DetailModal
        lead={detailTarget}
        open={detailOpen}
        setOpen={setDetailOpen}
        onStatusChange={handleStatusChange}
        onDelete={(l) => setDeleteTarget(l)}
        canProcess={canProcess}
        canDelete={canDelete}
      />

      <ConfirmModal
        open={!!deleteTarget}
        setOpen={() => setDeleteTarget(null)}
        title="Supprimer la demande"
        description="Êtes-vous sûr de supprimer cette demande de visite ? Cette action est irréversible."
        confirmFunction={handleDelete}
        cancelFuction={() => {}}
      />

      <ConfirmModal
        open={bulkDeleteModalOpen}
        setOpen={setBulkDeleteModalOpen}
        title="Supprimer les demandes sélectionnées"
        description={`Êtes-vous sûr de vouloir supprimer définitivement ${selectedIds.size} demande${selectedIds.size > 1 ? 's' : ''} de visite ? Cette action est irréversible.`}
        confirmFunction={handleBulkDelete}
        cancelFuction={() => {}}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Demandes envoyées par les visiteurs aux agents depuis les fiches des biens.
            Suivez-les et relancez l'agent si besoin
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

      {/* Actions groupées */}
      {selectedIds.size > 0 && (
        <div
          className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
          style={{ borderColor: colors.primary, backgroundColor: colors.primaryVeryLight }}
        >
          <span className="text-sm font-semibold" style={{ color: colors.primary }}>
            {selectedIds.size} demande{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {canProcess && (
              <>
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkStatus('contacted')}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                  style={{ borderColor: colors.primary, color: colors.primary, backgroundColor: 'transparent' }}
                >
                  Marquer contacté
                </button>
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkStatus('closed')}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                  style={{ borderColor: colors.success, color: colors.success, backgroundColor: 'transparent' }}
                >
                  Clôturer
                </button>
              </>
            )}
            {canDelete && (
              <button
                type="button"
                disabled={bulkActing}
                onClick={() => setBulkDeleteModalOpen(true)}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                style={{ borderColor: colors.error, color: colors.error, backgroundColor: 'transparent' }}
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}

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
                    { label: 'Demandeur' },
                    { label: 'Annonce' },
                    { label: 'Reçu le', secondary: true },
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
                {visible.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="w-8 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {(canProcess || canDelete) && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(lead.id)}
                          onChange={() => toggleSelect(lead.id)}
                          className="h-4 w-4 cursor-pointer rounded"
                          style={{ accentColor: colors.primary }}
                        />
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-gray-500">
                        <RiPhoneLine className="h-3.5 w-3.5" /> {lead.phone}
                      </p>
                    </td>
                    <td className="px-6 py-3">
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
                    <td className="hidden px-6 py-3 font-mono text-xs text-gray-500 lg:table-cell">
                      {firebaseDateFormat(lead.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setDetailTarget(lead)
                            setDetailOpen(true)
                          }}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Voir
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteTarget(lead)}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            title="Supprimer la demande"
                          >
                            <RiDeleteBinLine className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
