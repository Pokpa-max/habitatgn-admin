import { useEffect, useMemo, useRef, useState } from 'react'
import {
  RiCalendarCheckLine,
  RiSearchLine,
  RiMapPinLine,
  RiUserLine,
  RiPhoneLine,
  RiMailLine,
  RiWhatsappLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import StatusPill from '@/components/ui/StatusPill'
import AdminModal, { ModalButton, ModalFields, ModalNote, ModalSection, whatsappUrl } from '@/components/ui/AdminModal'
import PaginationButton from '@/components/Orders/PaginationButton'
import { formatGNF } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import {
  getAllBookings,
  getDailyRentalById,
  updateBookingStatus,
} from '@/lib/services/bookings'
import { getAgentRequestByUserId } from '@/lib/services/agentRequests'
import { useCanManage } from '@/hooks/useCanManage'

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'cancelled', label: 'Annulées' },
]

const STATUS_CONFIG = {
  pending: { label: 'En attente', tone: 'warning' },
  confirmed: { label: 'Confirmée', tone: 'success' },
  cancelled: { label: 'Annulée', tone: 'error' },
}

function nightsBetween(checkIn, checkOut) {
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

function BookingDetailDrawer({ booking, open, setOpen, onStatusChange, updating, canProcess }) {
  const colors = useColors()
  const lastAction = useRef(null)
  if (!booking) return null

  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate)
  // Bouton cliqué (chargement affiché sur celui-ci uniquement)
  const clicked = updating ? lastAction.current : null
  const act = (status) => {
    lastAction.current = status
    onStatusChange(booking, status)
  }
  const place = [booking.property?.location?.neighborhood, booking.property?.location?.municipality]
    .filter(Boolean)
    .join(', ')
  const whatsapp = whatsappUrl(booking.guestPhone)
  const pending = booking.status === 'pending' && canProcess

  return (
    <AdminModal
      open={open}
      onClose={() => setOpen(false)}
      eyebrow="Réservation · location à la nuitée"
      title={booking.property?.title || 'Location journalière'}
      meta={
        <>
          <StatusPill tone={statusCfg.tone}>{statusCfg.label}</StatusPill>
          {place && (
            <span className="inline-flex items-center gap-1">
              <RiMapPinLine className="h-3.5 w-3.5" />
              {place}
            </span>
          )}
        </>
      }
      footer={
        pending ? (
          <>
            {booking.guestPhone && (
              <ModalButton href={`tel:${booking.guestPhone}`} icon={RiPhoneLine}>
                Appeler
              </ModalButton>
            )}
            <ModalButton variant="danger" disabled={updating} loading={clicked === 'cancelled'} onClick={() => act('cancelled')}>
              Refuser
            </ModalButton>
            <ModalButton variant="primary" disabled={updating} loading={clicked === 'confirmed'} onClick={() => act('confirmed')}>
              Confirmer la réservation
            </ModalButton>
          </>
        ) : (
          <>
            {whatsapp && (
              <ModalButton href={whatsapp} external icon={RiWhatsappLine}>
                WhatsApp
              </ModalButton>
            )}
            {booking.guestPhone && (
              <ModalButton variant="primary" href={`tel:${booking.guestPhone}`} icon={RiPhoneLine}>
                Appeler le client
              </ModalButton>
            )}
          </>
        )
      }
    >
      <ModalSection title="Séjour">
        <ModalFields
          fields={[
            { label: 'Arrivée', value: firebaseDateFormat(booking.checkInDate) },
            { label: 'Départ', value: firebaseDateFormat(booking.checkOutDate) },
            { label: 'Durée', value: nights ? `${nights} nuit${nights > 1 ? 's' : ''}` : null },
            { label: 'Voyageurs', value: booking.numberOfGuests },
          ]}
        />
        <div
          className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
          style={{ backgroundColor: colors.primaryVeryLight }}
        >
          <span className="text-sm font-semibold text-gray-700">Montant total</span>
          <span className="text-lg font-bold" style={{ color: colors.primary }}>
            {formatGNF(booking.totalPrice)}
          </span>
        </div>
      </ModalSection>

      <ModalSection title="Client">
        <ModalFields
          fields={[
            { label: 'Nom', value: booking.guestName },
            { label: 'Téléphone', value: booking.guestPhone },
            { label: 'Email', value: booking.guestEmail, wide: true },
          ]}
        />
      </ModalSection>

      <ModalNote label="Note du client">{booking.notes}</ModalNote>

      {booking.agent?.fullName && (
        <ModalSection title="Propriétaire / agent">
          <p className="text-sm font-medium text-gray-900">{booking.agent.fullName}</p>
        </ModalSection>
      )}

      <p className="text-xs text-gray-400">Réservée le {firebaseDateFormat(booking.createdAt)}</p>
    </AdminModal>
  )
}

export default function ReservationsPage() {
  const colors = useColors()
  const canProcess = useCanManage('reservations', 'process')
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailBooking, setDetailBooking] = useState(null)
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

  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      const data = await getAllBookings()

      const uniqueRentalIds = [...new Set(data.map((b) => b.rentalId).filter(Boolean))]
      const uniqueOwnerIds = [...new Set(data.map((b) => b.ownerId).filter(Boolean))]

      const [properties, agents] = await Promise.all([
        Promise.all(uniqueRentalIds.map((id) => getDailyRentalById(id).catch(() => null))),
        Promise.all(uniqueOwnerIds.map((id) => getAgentRequestByUserId(id).catch(() => null))),
      ])

      const propertyMap = new Map(uniqueRentalIds.map((id, i) => [id, properties[i]]))
      const agentMap = new Map(uniqueOwnerIds.map((id, i) => [id, agents[i]]))

      setBookings(
        data.map((b) => ({
          ...b,
          property: propertyMap.get(b.rentalId) || null,
          agent: agentMap.get(b.ownerId) || null,
        }))
      )
    } catch (err) {
      console.error(err)
      notify('Erreur lors du chargement des réservations', 'error')
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleStatusChange = async (booking, status) => {
    if (!canProcess) return
    setUpdatingId(booking.id)
    try {
      await updateBookingStatus(booking.id, status)
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status } : b))
      )
      setDetailBooking((prev) => (prev?.id === booking.id ? { ...prev, status } : prev))
      notify(
        status === 'confirmed' ? 'Réservation confirmée' : 'Réservation refusée',
        'success'
      )
      setDetailOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setUpdatingId(null)
  }

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter
      if (!matchStatus) return false
      if (!searchTerm) return true
      const q = searchTerm.toLowerCase()
      return (
        b.guestName?.toLowerCase().includes(q) ||
        b.guestPhone?.toLowerCase().includes(q) ||
        b.property?.title?.toLowerCase().includes(q)
      )
    })
  }, [bookings, statusFilter, searchTerm])

  const visible = filtered.slice(0, visibleCount)

  const selectableIds = canProcess ? visible.map((b) => b.id) : []
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
    const targets = bookings.filter((b) => selectedIds.has(b.id))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      await Promise.all(targets.map((b) => updateBookingStatus(b.id, status)))
      const targetIds = new Set(targets.map((b) => b.id))
      setBookings((prev) =>
        prev.map((b) => (targetIds.has(b.id) ? { ...b, status } : b))
      )
      notify(
        `${targets.length} réservation${targets.length > 1 ? 's' : ''} ${status === 'confirmed' ? 'confirmée(s)' : 'refusée(s)'}`,
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
      <BookingDetailDrawer
        booking={detailBooking}
        open={detailOpen}
        setOpen={setDetailOpen}
        onStatusChange={handleStatusChange}
        updating={updatingId === detailBooking?.id}
        canProcess={canProcess}
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Réservations</h2>
            <p className="mt-1 text-sm text-gray-500">
              Réservations de location journalière, tous agents confondus
            </p>
          </div>
          <div className="relative sm:w-64">
            <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher client, bien..."
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === 'all'
                ? bookings.length
                : bookings.filter((b) => b.status === f.value).length
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
        {canProcess && selectedIds.size > 0 && (
          <div
            className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: colors.primary, backgroundColor: colors.primaryVeryLight }}
          >
            <span className="text-sm font-semibold" style={{ color: colors.primary }}>
              {selectedIds.size} réservation{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                disabled={bulkActing}
                onClick={() => handleBulkStatus('confirmed')}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                style={{ borderColor: colors.success, color: colors.success, backgroundColor: 'transparent' }}
              >
                Confirmer
              </button>
              <button
                type="button"
                disabled={bulkActing}
                onClick={() => handleBulkStatus('cancelled')}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                style={{ borderColor: colors.error, color: colors.error, backgroundColor: 'transparent' }}
              >
                Refuser
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
            <RiCalendarCheckLine className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">Aucune réservation dans cette catégorie</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>
                    <th scope="col" className="w-8 px-4 py-2.5">
                      {canProcess && (
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
                      { label: 'Bien' },
                      { label: 'Client' },
                      { label: 'Dates' },
                      { label: 'Voyageurs', secondary: true },
                      { label: 'Montant' },
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
                  {visible.map((booking) => {
                    const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
                    const nights = nightsBetween(booking.checkInDate, booking.checkOutDate)
                    return (
                      <tr
                        key={booking.id}
                        onClick={() => {
                          setDetailBooking(booking)
                          setDetailOpen(true)
                        }}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="w-8 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          {canProcess && (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(booking.id)}
                              onChange={() => toggleSelect(booking.id)}
                              className="h-4 w-4 cursor-pointer rounded"
                              style={{ accentColor: colors.primary }}
                            />
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {booking.property?.title || 'Location journalière'}
                          </p>
                          {booking.agent?.fullName && (
                            <p className="text-xs text-gray-400">{booking.agent.fullName}</p>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-sm text-gray-800">{booking.guestName}</p>
                          <p className="font-mono text-xs text-gray-500">{booking.guestPhone}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-mono text-xs text-gray-600">
                            {firebaseDateFormat(booking.checkInDate)} → {firebaseDateFormat(booking.checkOutDate)}
                          </p>
                          {nights && (
                            <p className="text-xs text-gray-400">
                              {nights} nuit{nights > 1 ? 's' : ''}
                            </p>
                          )}
                        </td>
                        <td className="hidden px-6 py-3 text-sm text-gray-600 lg:table-cell">{booking.numberOfGuests}</td>
                        <td className="whitespace-nowrap px-6 py-3 font-mono text-sm font-semibold" style={{ color: colors.primary }}>
                          {formatGNF(booking.totalPrice)}
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
