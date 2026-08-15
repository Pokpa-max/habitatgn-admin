import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  RiCalendarCheckLine,
  RiSearchLine,
  RiMapPinLine,
  RiUserLine,
  RiPhoneLine,
  RiMailLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import PaginationButton from '@/components/Orders/PaginationButton'
import { formatGNF } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import {
  getAllBookings,
  getDailyRentalById,
  updateBookingStatus,
} from '@/lib/services/bookings'
import { getAgentRequestByUserId } from '@/lib/services/agentRequests'

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmées' },
  { value: 'cancelled', label: 'Annulées' },
]

const STATUS_CONFIG = {
  pending: { label: 'En attente', bg: '#FEF3C7', color: '#92400E' },
  confirmed: { label: 'Confirmée', bg: '#DCFCE7', color: '#166534' },
  cancelled: { label: 'Annulée', bg: '#FEE2E2', color: '#991B1B' },
}

function nightsBetween(checkIn, checkOut) {
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  const diff = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

function BookingDetailDrawer({ booking, open, setOpen, onStatusChange, updating }) {
  const colors = useColors()
  if (!booking) return null

  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
  const nights = nightsBetween(booking.checkInDate, booking.checkOutDate)

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
                        {booking.property?.title || 'Location journalière'}
                      </Dialog.Title>
                      {booking.property?.location && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <RiMapPinLine className="h-3.5 w-3.5" />
                          {[
                            booking.property.location.neighborhood,
                            booking.property.location.municipality,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                    <span
                      className="flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Client
                  </p>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-1.5 text-gray-800">
                      <RiUserLine className="h-3.5 w-3.5 text-gray-400" />
                      {booking.guestName}
                    </p>
                    <p className="flex items-center gap-1.5 text-gray-600">
                      <RiPhoneLine className="h-3.5 w-3.5 text-gray-400" />
                      {booking.guestPhone}
                    </p>
                    {booking.guestEmail && (
                      <p className="flex items-center gap-1.5 text-gray-600">
                        <RiMailLine className="h-3.5 w-3.5 text-gray-400" />
                        {booking.guestEmail}
                      </p>
                    )}
                  </div>

                  {booking.agent?.fullName && (
                    <>
                      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Agent / Propriétaire
                      </p>
                      <p className="text-sm text-gray-800">{booking.agent.fullName}</p>
                    </>
                  )}

                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Arrivée</p>
                      <p className="text-gray-900">{firebaseDateFormat(booking.checkInDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Départ</p>
                      <p className="text-gray-900">{firebaseDateFormat(booking.checkOutDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Voyageurs</p>
                      <p className="text-gray-900">{booking.numberOfGuests}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Durée</p>
                      <p className="text-gray-900">{nights ? `${nights} nuit${nights > 1 ? 's' : ''}` : '—'}</p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Note du client</p>
                      <p className="mt-1 text-sm italic text-gray-700">{booking.notes}</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Montant total</p>
                    <p className="text-lg font-bold" style={{ color: colors.primary }}>
                      {formatGNF(booking.totalPrice)}
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-gray-400">
                    Réservée le {firebaseDateFormat(booking.createdAt)}
                  </p>
                </div>

                <div className="flex gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-4">
                  {booking.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => onStatusChange(booking, 'cancelled')}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-60"
                      >
                        Refuser
                      </button>
                      <button
                        type="button"
                        disabled={updating}
                        onClick={() => onStatusChange(booking, 'confirmed')}
                        className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-60"
                        style={{ backgroundColor: colors.primary }}
                      >
                        {updating ? <Loader /> : 'Confirmer'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Fermer
                    </button>
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

export default function ReservationsPage() {
  const colors = useColors()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailBooking, setDetailBooking] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
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

  return (
    <div className="mx-auto px-4 py-6 sm:px-6 md:px-8">
      <BookingDetailDrawer
        booking={detailBooking}
        open={detailOpen}
        setOpen={setDetailOpen}
        onStatusChange={handleStatusChange}
        updating={updatingId === detailBooking?.id}
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
                    {['Bien', 'Client', 'Dates', 'Voyageurs', 'Montant', 'Statut'].map((h) => (
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
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {booking.property?.title || 'Location journalière'}
                          </p>
                          {booking.agent?.fullName && (
                            <p className="text-xs text-gray-400">{booking.agent.fullName}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-800">{booking.guestName}</p>
                          <p className="text-xs text-gray-500">{booking.guestPhone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-gray-600">
                            {firebaseDateFormat(booking.checkInDate)} → {firebaseDateFormat(booking.checkOutDate)}
                          </p>
                          {nights && (
                            <p className="text-xs text-gray-400">
                              {nights} nuit{nights > 1 ? 's' : ''}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{booking.numberOfGuests}</td>
                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: colors.primary }}>
                          {formatGNF(booking.totalPrice)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                          >
                            {statusCfg.label}
                          </span>
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
