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
  getServiceRequests,
  updateServiceRequestStatus,
  deleteServiceRequest,
} from '@/lib/services/serviceRequests'
import { notify } from '@/utils/toast'
import {
  RiCalendarLine,
  RiPhoneLine,
  RiMapPinLine,
  RiTimeLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiCloseLine,
} from 'react-icons/ri'
import Loader from '@/components/Loader'

// ─── Statuts ────────────────────────────────────────────────────────────────

const STATUSES = [
  {
    value: 'pending',
    label: 'En attente',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
  },
  {
    value: 'accepted',
    label: 'Accepté',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  {
    value: 'in_progress',
    label: 'En cours',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
  },
  {
    value: 'completed',
    label: 'Terminé',
    bg: 'bg-green-100',
    text: 'text-green-700',
    final: true,
  },
  {
    value: 'rejected',
    label: 'Rejeté',
    bg: 'bg-red-100',
    text: 'text-red-700',
    final: true,
  },
]

const getStatus = (value) =>
  STATUSES.find((s) => s.value === value) || STATUSES[0]

const isFinal = (value) => STATUSES.find((s) => s.value === value)?.final === true

const FILTER_TABS = [{ value: 'all', label: 'Tous' }, ...STATUSES]

// ─── Badge statut ────────────────────────────────────────────────────────────

function StatusBadge({ value }) {
  const s = getStatus(value)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}
    >
      {s.label}
    </span>
  )
}

// ─── Modal détail ─────────────────────────────────────────────────────────────

function DetailModal({ request, colors, onClose, onStatusChange }) {
  const [updating, setUpdating] = useState(false)

  if (!request) return null

  const handleStatus = async (status) => {
    setUpdating(true)
    await onStatusChange(request.id, status)
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
              {request.serviceType}
            </h2>
            <p className="text-sm text-white/70">Demande de service</p>
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
            <StatusBadge value={request.status} />
          </div>

          {/* Infos */}
          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
            <Row
              icon={<RiPhoneLine />}
              label="Client"
              value={request.name}
              colors={colors}
            />
            <Row
              icon={<RiPhoneLine />}
              label="Téléphone"
              value={
                <a
                  href={`tel:${request.phone}`}
                  className="font-semibold hover:underline"
                  style={{ color: colors.primary }}
                >
                  {request.phone}
                </a>
              }
              colors={colors}
            />
            <Row
              icon={<RiMapPinLine />}
              label="Adresse"
              value={request.address}
              colors={colors}
            />
            <Row
              icon={<RiCalendarLine />}
              label="Date prévue"
              value={request.scheduledDate}
              colors={colors}
            />
            <Row
              icon={<RiTimeLine />}
              label="Heure"
              value={request.scheduledTime}
              colors={colors}
            />
          </div>

          {/* Description */}
          {request.description && (
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Description
              </p>
              <p className="text-sm text-gray-700">{request.description}</p>
            </div>
          )}

          {/* Changer statut */}
          {isFinal(request.status) ? (
            <p className="rounded-xl bg-gray-50 px-4 py-3 text-center text-xs font-semibold text-gray-400">
              Statut final — aucune modification possible
            </p>
          ) : (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Changer le statut
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((s) => s.value !== request.status).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatus(s.value)}
                    disabled={updating}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${s.bg} ${s.text} hover:opacity-80`}
                  >
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

function ServiceRequestsPage() {
  const colors = useColors()
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await getServiceRequests()
        setRequests(data)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return requests
    return requests.filter((r) => r.status === activeFilter)
  }, [requests, activeFilter])

  const handleStatusChange = async (id, status) => {
    try {
      await updateServiceRequestStatus(id, status)
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      )
      // Update selected request too if open
      setSelectedRequest((prev) =>
        prev?.id === id ? { ...prev, status } : prev
      )
      notify('Statut mis à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteServiceRequest(id)
      setRequests((prev) => prev.filter((r) => r.id !== id))
      setDeleteConfirm(null)
      if (selectedRequest?.id === id) setSelectedRequest(null)
      notify('Demande supprimée', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  // Counts per status
  const counts = useMemo(() => {
    const c = { all: requests.length }
    STATUSES.forEach((s) => {
      c[s.value] = requests.filter((r) => r.status === s.value).length
    })
    return c
  }, [requests])

  return (
    <Scaffold>
      <div className="px-4 sm:px-6 lg:px-8">
        <Header title="Demandes de service" />

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
            <p className="text-sm text-gray-400">Aucune demande</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Infos principales */}
                <div className="flex items-start gap-4">
                  {/* Icône service */}
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                  >
                    🔧
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {req.serviceType}
                      </p>
                      <StatusBadge value={req.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {req.name} · {req.phone}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <RiMapPinLine className="h-3.5 w-3.5" /> {req.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <RiCalendarLine className="h-3.5 w-3.5" />{' '}
                        {req.scheduledDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <RiTimeLine className="h-3.5 w-3.5" />{' '}
                        {req.scheduledTime}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {/* Changement statut rapide */}
                  {!isFinal(req.status) && (
                    <select
                      value={req.status}
                      onChange={(e) => handleStatusChange(req.id, e.target.value)}
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
                    onClick={() => setSelectedRequest(req)}
                    className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                    title="Voir détails"
                  >
                    <RiEyeLine className="h-4 w-4" />
                  </button>

                  {/* Supprimer */}
                  {deleteConfirm === req.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(req.id)}
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
                      onClick={() => setDeleteConfirm(req.id)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
                      title="Supprimer"
                    >
                      <RiDeleteBinLine className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal détail */}
      {selectedRequest && (
        <DetailModal
          request={selectedRequest}
          colors={colors}
          onClose={() => setSelectedRequest(null)}
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
})(ServiceRequestsPage)
