import { useEffect, useState } from 'react'
import {
  RiMailLine,
  RiPhoneLine,
  RiMore2Fill,
  RiSearchLine,
  RiMailOpenLine,
  RiDeleteBinLine,
  RiFileCopyLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import PaginationButton from '@/components/Orders/PaginationButton'
import ConfirmModal from '@/components/ConfirmModal'
import StatusPill from '@/components/ui/StatusPill'
import AdminModal, { ModalButton, ModalFields, ModalNote, ModalSection } from '@/components/ui/AdminModal'
import { firebaseDateFormat } from '@/utils/date'
import {
  getContactMessages,
  setContactMessageRead,
  deleteContactMessage,
} from '@/lib/services/contactMessages'
import { getContactSettings } from '@/lib/services/siteSettings'
import { useCanManage } from '@/hooks/useCanManage'

const PAGE_SIZE = 10

const FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'unread', label: 'Non lues' },
  { value: 'read', label: 'Lues' },
]

function DetailModal({ message, open, setOpen, onToggleRead, onDelete, senderEmail, canProcess, canDelete }) {
  if (!message) return null

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1${
    senderEmail ? `&authuser=${encodeURIComponent(senderEmail)}` : ''
  }&to=${encodeURIComponent(message.email)}&su=${encodeURIComponent('RE: ' + (message.subject || ''))}`
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(message.email)
      notify('Adresse email copiée', 'success')
    } catch (e) {
      notify("Impossible de copier l'adresse", 'error')
    }
  }

  return (
    <AdminModal
      open={open}
      onClose={() => setOpen(false)}
      eyebrow="Message de contact"
      title={message.subject || 'Sans objet'}
      meta={
        <>
          <StatusPill tone={message.read ? 'gray' : 'warning'}>{message.read ? 'Lu' : 'Non lu'}</StatusPill>
          <span>Reçu le {firebaseDateFormat(message.createdAt)}</span>
        </>
      }
      footer={
        <>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(message)}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-500 hover:text-red-600 sm:mr-auto"
            >
              <RiDeleteBinLine className="h-4 w-4" />
              Supprimer
            </button>
          )}
          {canProcess && (
            <ModalButton icon={RiMailOpenLine} onClick={() => onToggleRead(message)}>
              {message.read ? 'Marquer non lu' : 'Marquer lu'}
            </ModalButton>
          )}
          <ModalButton variant="primary" href={gmailUrl} external icon={RiMailLine}>
            Répondre
          </ModalButton>
        </>
      }
    >
      <ModalSection title="Expéditeur">
        <ModalFields
          fields={[
            { label: 'Nom', value: message.name },
            { label: 'Téléphone', value: message.phone },
            {
              label: 'Email',
              wide: true,
              value: message.email && (
                <span className="flex items-center gap-2">
                  <span className="truncate">{message.email}</span>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Copier l'adresse"
                  >
                    <RiFileCopyLine className="h-4 w-4" />
                  </button>
                </span>
              ),
            },
          ]}
        />
      </ModalSection>

      <ModalNote label="Message">{message.message}</ModalNote>

      {senderEmail && <p className="text-xs text-gray-400">La réponse partira depuis {senderEmail} (Gmail).</p>}
    </AdminModal>
  )
}

export default function ContactMessagesPage() {
  const colors = useColors()
  const canProcess = useCanManage('messages', 'process')
  const canDelete = useCanManage('messages', 'delete')
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailTarget, setDetailTarget] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [senderEmail, setSenderEmail] = useState('')

  // Sélection multiple / actions groupées
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkActing, setBulkActing] = useState(false)
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [messagesData, contactSettings] = await Promise.all([
          getContactMessages(),
          getContactSettings(),
        ])
        setMessages(messagesData)
        setSenderEmail(contactSettings?.email || '')
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

  const handleToggleRead = async (message) => {
    if (!canProcess) return
    const nextRead = !message.read
    try {
      await setContactMessageRead(message.id, nextRead)
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, read: nextRead } : m)))
      setDetailTarget((prev) => (prev?.id === message.id ? { ...prev, read: nextRead } : prev))
      notify('Message mis à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleDelete = async () => {
    if (!canDelete) return
    try {
      await deleteContactMessage(deleteTarget.id)
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id))
      setDeleteTarget(null)
      setDetailOpen(false)
      notify('Message supprimé avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filtered = messages.filter((m) => {
    const matchFilter =
      filter === 'all' || (filter === 'unread' ? !m.read : m.read)
    if (!matchFilter) return false
    if (!searchTerm) return true
    const lower = searchTerm.toLowerCase()
    return (
      m.name?.toLowerCase().includes(lower) ||
      m.email?.toLowerCase().includes(lower) ||
      m.subject?.toLowerCase().includes(lower)
    )
  })
  const visible = filtered.slice(0, visibleCount)
  const unreadCount = messages.filter((m) => !m.read).length

  const selectableIds = canProcess || canDelete ? visible.map((m) => m.id) : []
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

  const handleBulkSetRead = async (nextRead) => {
    if (!canProcess) return
    const targets = messages.filter((m) => selectedIds.has(m.id))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      await Promise.all(targets.map((m) => setContactMessageRead(m.id, nextRead)))
      const targetIds = new Set(targets.map((m) => m.id))
      setMessages((prev) =>
        prev.map((m) => (targetIds.has(m.id) ? { ...m, read: nextRead } : m))
      )
      notify(
        `${targets.length} message${targets.length > 1 ? 's' : ''} marqué${targets.length > 1 ? 's' : ''} ${nextRead ? 'lu(s)' : 'non lu(s)'}`,
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
      await Promise.all([...targetIds].map((id) => deleteContactMessage(id)))
      setMessages((prev) => prev.filter((m) => !targetIds.has(m.id)))
      notify(`${targetIds.size} message${targetIds.size > 1 ? 's' : ''} supprimé(s)`, 'success')
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
        message={detailTarget}
        open={detailOpen}
        setOpen={setDetailOpen}
        onToggleRead={handleToggleRead}
        onDelete={(m) => setDeleteTarget(m)}
        senderEmail={senderEmail}
        canProcess={canProcess}
        canDelete={canDelete}
      />

      <ConfirmModal
        open={!!deleteTarget}
        setOpen={() => setDeleteTarget(null)}
        title="Supprimer le message"
        description="Êtes-vous sûr de supprimer ce message ? Cette action est irréversible."
        confirmFunction={handleDelete}
        cancelFuction={() => {}}
      />

      <ConfirmModal
        open={bulkDeleteModalOpen}
        setOpen={setBulkDeleteModalOpen}
        title="Supprimer les messages sélectionnés"
        description={`Êtes-vous sûr de vouloir supprimer définitivement ${selectedIds.size} message${selectedIds.size > 1 ? 's' : ''} ? Cette action est irréversible.`}
        confirmFunction={handleBulkDelete}
        cancelFuction={() => {}}
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Messages envoyés depuis le formulaire "Nous contacter" du site public
            {unreadCount > 0 ? ` · ${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div className="relative sm:w-64">
          <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, email, sujet..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {FILTERS.map((f) => {
          const count =
            f.value === 'all'
              ? messages.length
              : messages.filter((m) => (f.value === 'unread' ? !m.read : m.read)).length
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
            {selectedIds.size} message{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {canProcess && (
              <>
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkSetRead(true)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                  style={{ borderColor: colors.success, color: colors.success, backgroundColor: 'transparent' }}
                >
                  Marquer lu
                </button>
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkSetRead(false)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                  style={{ borderColor: colors.warning, color: colors.warning, backgroundColor: 'transparent' }}
                >
                  Marquer non lu
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
          <RiMailLine className="h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">Aucun message dans cette catégorie</p>
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
                    { label: 'Expéditeur' },
                    { label: 'Sujet' },
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
                {visible.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="w-8 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {(canProcess || canDelete) && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(message.id)}
                          onChange={() => toggleSelect(message.id)}
                          className="h-4 w-4 cursor-pointer rounded"
                          style={{ accentColor: colors.primary }}
                        />
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <p
                        className="text-sm text-gray-900"
                        style={{ fontWeight: message.read ? 500 : 700 }}
                      >
                        {message.name}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                        <RiMailLine className="h-3.5 w-3.5" /> {message.email}
                      </p>
                    </td>
                    <td className="px-6 py-3">
                      <p
                        className="max-w-xs truncate text-sm text-gray-700"
                        style={{ fontWeight: message.read ? 400 : 600 }}
                      >
                        {message.subject}
                      </p>
                    </td>
                    <td className="hidden px-6 py-3 font-mono text-xs text-gray-500 lg:table-cell">
                      {firebaseDateFormat(message.createdAt)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: message.read ? colors.gray400 : colors.primary }}
                        />
                        {message.read ? 'Lu' : 'Non lu'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => {
                          setDetailTarget(message)
                          setDetailOpen(true)
                          if (!message.read) handleToggleRead(message)
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        title="Voir le message"
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
