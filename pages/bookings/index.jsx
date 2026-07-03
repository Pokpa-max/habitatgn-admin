import React, { useEffect, useState, useMemo } from 'react'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import { useColors } from '../../contexts/ColorContext'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import {
  getDailyBookings,
  updateBookingStatus,
  deleteDailyBooking,
} from '@/lib/services/dailyBookings'
import { notify } from '@/utils/toast'
import {
  RiCalendarLine,
  RiPhoneLine,
  RiGroupLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiCloseLine,
  RiMoneyDollarCircleLine,
  RiHome4Line,
  RiArrowRightLine,
} from 'react-icons/ri'
import Loader from '@/components/Loader'
import Link from 'next/link'

// ─── Statuts ────────────────────────────────────────────────────────────────

const STATUSES = [
  {
    value: 'pending',
    label: 'En attente',
    dot: 'gray400',
  },
  {
    value: 'confirmed',
    label: 'Confirmé',
    dot: 'primary',
  },
  {
    value: 'completed',
    label: 'Terminé',
    dot: 'gray700',
    final: true,
  },
  {
    value: 'cancelled',
    label: 'Annulé',
    dot: 'gray300',
    final: true,
  },
]

const isFinal = (value) => STATUSES.find((s) => s.value === value)?.final === true

const getStatus = (value) =>
  STATUSES.find((s) => s.value === value) || STATUSES[0]

const FILTER_TABS = [{ value: 'all', label: 'Tous' }, ...STATUSES]

const formatPrice = (price) =>
  new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
  }).format(price || 0)

const daysBetween = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null
  const d1 = new Date(checkIn)
  const d2 = new Date(checkOut)
  const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

// ─── Badge statut ────────────────────────────────────────────────────────────

function StatusBadge({ value }) {
  const colors = useColors()
  const s = getStatus(value)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors[s.dot] }} />
      {s.label}
    </span>
  )
}

// ─── Modal détail ─────────────────────────────────────────────────────────────

function DetailModal({ booking, colors, onClose, onStatusChange }) {
  const [updating, setUpdating] = useState(false)

  if (!booking) return null

  const nights = daysBetween(booking.checkInDate, booking.checkOutDate)

  const handleStatus = async (status) => {
    setUpdating(true)
    await onStatusChange(booking.id, status)
    setUpdating(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between rounded-t-2xl px-6 py-4"
          style={{ backgroundColor: colors.primary }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">
              {booking.guestName}
            </h2>
            <p className="text-sm text-white/70">
              Réservation · {booking.checkInDate} → {booking.checkOutDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/20"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Statut courant */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">
              Statut actuel
            </span>
            <StatusBadge value={booking.status} />
          </div>

          {/* Infos */}
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            <Row
              icon={<RiPhoneLine />}
              label="Invité"
              value={booking.guestName}
              colors={colors}
            />
            <Row
              icon={<RiPhoneLine />}
              label="Téléphone"
              value={
                <a
                  href={`tel:${booking.guestPhone}`}
                  className="font-semibold hover:underline"
                  style={{ color: colors.primary }}
                >
                  {booking.guestPhone}
                </a>
              }
              colors={colors}
            />
            <Row
              icon={<RiGroupLine />}
              label="Invités"
              value={`${booking.numberOfGuests} personne(s)`}
              colors={colors}
            />
            <Row
              icon={<RiCalendarLine />}
              label="Arrivée"
              value={booking.checkInDate}
              colors={colors}
            />
            <Row
              icon={<RiCalendarLine />}
              label="Départ"
              value={
                <span>
                  {booking.checkOutDate}
                  {nights && (
                    <span className="ml-2 text-xs text-gray-400">
                      ({nights} nuit{nights > 1 ? 's' : ''})
                    </span>
                  )}
                </span>
              }
              colors={colors}
            />
            <Row
              icon={<RiMoneyDollarCircleLine />}
              label="Prix total"
              value={
                <span className="font-bold" style={{ color: colors.primary }}>
                  {formatPrice(booking.totalPrice)}
                </span>
              }
              colors={colors}
            />
          </div>

          {/* Lien vers le logement */}
          {booking.rentalId && (
            <Link
              href={`/daily-rentals/${booking.rentalId}`}
              className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <RiHome4Line
                  className="h-5 w-5"
                  style={{ color: colors.primary }}
                />
                <span className="text-sm font-semibold text-gray-700">
                  Voir le logement
                </span>
              </div>
              <RiArrowRightLine className="h-4 w-4 text-gray-400" />
            </Link>
          )}

          {/* Changer statut */}
          {isFinal(booking.status) ? (
            <p className="rounded-xl bg-gray-50 px-4 py-3 text-center text-xs font-semibold text-gray-400">
              Statut final — aucune modification possible
            </p>
          ) : (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Changer le statut
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((s) => s.value !== booking.status).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatus(s.value)}
                    disabled={updating}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors[s.dot] }} />
                    {updating ? '...' : s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, value, colors }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span style={{ color: colors.primary }} className="flex-shrink-0 text-lg">
        {icon}
      </span>
      <span className="w-28 flex-shrink-0 text-xs font-semibold text-gray-400">
        {label}
      </span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

function BookingsPage() {
  const colors = useColors()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getDailyBookings()
        setBookings(data)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return bookings
    return bookings.filter((b) => b.status === activeFilter)
  }, [bookings, activeFilter])

  const counts = useMemo(() => {
    const c = { all: bookings.length }
    STATUSES.forEach((s) => {
      c[s.value] = bookings.filter((b) => b.status === s.value).length
    })
    return c
  }, [bookings])

  const handleStatusChange = async (id, status) => {
    try {
      await updateBookingStatus(id, status)
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      )
      setSelectedBooking((prev) =>
        prev?.id === id ? { ...prev, status } : prev
      )
      notify('Statut mis à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDailyBooking(id)
      setBookings((prev) => prev.filter((b) => b.id !== id))
      setDeleteConfirm(null)
      if (selectedBooking?.id === id) setSelectedBooking(null)
      notify('Réservation supprimée', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  return (
    <Scaffold>
      <div className="px-4 sm:px-6 lg:px-8">
        <Header title="Réservations" />

        {/* Filter tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
                style={
                  active
                    ? { backgroundColor: colors.primary, color: '#fff' }
                    : { backgroundColor: '#f3f4f6', color: '#374151' }
                }
              >
                {tab.label}
                <span
                  className="rounded-full px-1.5 py-0.5 text-xs"
                  style={
                    active
                      ? {
                          backgroundColor: 'rgba(255,255,255,0.25)',
                          color: '#fff',
                        }
                      : { backgroundColor: '#e5e7eb', color: '#6b7280' }
                  }
                >
                  {counts[tab.value] ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl bg-white shadow-sm">
            <RiCalendarLine className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">Aucune réservation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((booking) => {
              const nights = daysBetween(
                booking.checkInDate,
                booking.checkOutDate
              )
              return (
                <div
                  key={booking.id}
                  className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  {/* Infos principales */}
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{
                        backgroundColor: `${colors.primary}15`,
                        color: colors.primary,
                      }}
                    >
                      🏠
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {booking.guestName}
                        </p>
                        <StatusBadge value={booking.status} />
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {booking.guestPhone} · {booking.numberOfGuests} invité
                        {booking.numberOfGuests > 1 ? 's' : ''}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <RiCalendarLine className="h-3.5 w-3.5" />
                          {booking.checkInDate}
                          <RiArrowRightLine className="h-3 w-3" />
                          {booking.checkOutDate}
                          {nights && (
                            <span className="text-gray-300">({nights}n)</span>
                          )}
                        </span>
                        <span
                          className="flex items-center gap-1 font-semibold"
                          style={{ color: colors.primary }}
                        >
                          <RiMoneyDollarCircleLine className="h-3.5 w-3.5" />
                          {formatPrice(booking.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {/* Changement statut rapide */}
                    {!isFinal(booking.status) && (
                      <select
                        value={booking.status}
                        onChange={(e) =>
                          handleStatusChange(booking.id, e.target.value)
                        }
                        className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700 focus:border-gray-300 focus:outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Voir détails */}
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                      title="Voir détails"
                    >
                      <RiEyeLine className="h-4 w-4" />
                    </button>

                    {/* Supprimer */}
                    {deleteConfirm === booking.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="rounded-lg bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(booking.id)}
                        className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
                        title="Supprimer"
                      >
                        <RiDeleteBinLine className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal détail */}
      {selectedBooking && (
        <DetailModal
          booking={selectedBooking}
          colors={colors}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </Scaffold>
  )
}

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (AuthUser.claims.userType !== 'admin') {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(BookingsPage)
