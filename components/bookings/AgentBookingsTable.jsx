import { useEffect, useMemo, useState } from 'react'
import { RiCalendarLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import PaginationButton from '@/components/Orders/PaginationButton'
import { getBookingsByOwnerId, updateBookingStatus } from '@/lib/services/dailyBookings'

const PAGE_SIZE = 10

const STATUSES = [
  { value: 'pending', label: 'En attente', dot: 'gray400' },
  { value: 'confirmed', label: 'Confirmé', dot: 'primary' },
  { value: 'completed', label: 'Terminé', dot: 'gray700' },
  { value: 'cancelled', label: 'Annulé', dot: 'gray300' },
]

const getStatus = (value) => STATUSES.find((s) => s.value === value) || STATUSES[0]

const formatPrice = (price) =>
  new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: 'GNF',
    minimumFractionDigits: 0,
  }).format(price || 0)

const formatDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('fr-FR')
}

export default function AgentBookingsTable({ agentId, dailyRentals }) {
  const colors = useColors()
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const rentalTitles = useMemo(() => {
    const map = {}
    ;(dailyRentals || []).forEach((r) => {
      map[r.id] = r.houseType?.label || 'Location journalière'
    })
    return map
  }, [dailyRentals])

  useEffect(() => {
    if (!agentId) return
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getBookingsByOwnerId(agentId)
        setBookings(data)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [agentId])

  const handleStatusChange = async (booking, status) => {
    try {
      await updateBookingStatus(booking.id, status)
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status } : b)))
      notify('Statut mis à jour avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const visible = bookings.slice(0, visibleCount)

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-gray-200 bg-white">
        <Loader color="#111827" />
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
        <RiCalendarLine className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-400">Aucune réservation pour cet agent</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style={{ backgroundColor: colors.gray50 }}>
            <tr>
              {['Locataire', 'Bien', 'Séjour', 'Montant', 'Statut'].map((h) => (
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
              const status = getStatus(booking.status)
              return (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{booking.guestName}</p>
                    <p className="text-xs text-gray-500">{booking.guestPhone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {rentalTitles[booking.rentalId] || 'Location journalière'}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatPrice(booking.totalPrice)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: colors[status.dot] }}
                      />
                      <select
                        value={booking.status || 'pending'}
                        onChange={(e) => handleStatusChange(booking, e.target.value)}
                        className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-700"
                      >
                        {STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {visibleCount < bookings.length && (
        <PaginationButton getmoreData={() => setVisibleCount((c) => c + PAGE_SIZE)} />
      )}
    </div>
  )
}
