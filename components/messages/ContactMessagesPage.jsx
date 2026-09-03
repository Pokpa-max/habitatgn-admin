import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
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
import { firebaseDateFormat } from '@/utils/date'
import {
  getContactMessages,
  setContactMessageRead,
  deleteContactMessage,
} from '@/lib/services/contactMessages'
import { getContactSettings } from '@/lib/services/siteSettings'

const PAGE_SIZE = 10

const FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'unread', label: 'Non lues' },
  { value: 'read', label: 'Lues' },
]

function DetailModal({ message, open, setOpen, onToggleRead, onDelete, senderEmail }) {
  const colors = useColors()
  if (!message) return null

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
                    {message.subject}
                  </Dialog.Title>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {message.name} · {firebaseDateFormat(message.createdAt)}
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto p-5">
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-1.5 text-gray-600">
                      <RiMailLine className="h-3.5 w-3.5 text-gray-400" /> {message.email}
                    </p>
                    {message.phone && (
                      <p className="flex items-center gap-1.5 text-gray-600">
                        <RiPhoneLine className="h-3.5 w-3.5 text-gray-400" /> {message.phone}
                      </p>
                    )}
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm text-gray-800">{message.message}</p>

                  <div className="mt-5 flex flex-col gap-2">
                    <button
                      onClick={() => onToggleRead(message)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <RiMailOpenLine className="h-4 w-4 text-gray-400" />
                      {message.read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                    </button>
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1${
                        senderEmail ? `&authuser=${encodeURIComponent(senderEmail)}` : ''
                      }&to=${encodeURIComponent(message.email)}&su=${encodeURIComponent(
                        'RE: ' + message.subject
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <RiMailLine className="h-4 w-4" />
                      Répondre par email (Gmail)
                    </a>
                    {senderEmail && (
                      <p className="text-center text-xs text-gray-400">
                        Depuis {senderEmail}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(message.email)
                          notify('Adresse email copiée', 'success')
                        } catch (e) {
                          notify("Impossible de copier l'adresse", 'error')
                        }
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <RiFileCopyLine className="h-4 w-4 text-gray-400" />
                      Copier l'adresse email
                    </button>
                    <button
                      onClick={() => onDelete(message)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-red-500"
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                      Supprimer le message
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

export default function ContactMessagesPage() {
  const colors = useColors()
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

  const selectableIds = visible.map((m) => m.id)
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
          <h2 className="text-lg font-bold text-gray-900">Messages de contact</h2>
          <p className="mt-1 text-sm text-gray-500">
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
            <button
              type="button"
              disabled={bulkActing}
              onClick={() => setBulkDeleteModalOpen(true)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
              style={{ borderColor: colors.error, color: colors.error, backgroundColor: 'transparent' }}
            >
              Supprimer
            </button>
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
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 cursor-pointer rounded"
                      style={{ accentColor: colors.primary }}
                      title="Tout sélectionner"
                    />
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
                      <input
                        type="checkbox"
                        checked={selectedIds.has(message.id)}
                        onChange={() => toggleSelect(message.id)}
                        className="h-4 w-4 cursor-pointer rounded"
                        style={{ accentColor: colors.primary }}
                      />
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
