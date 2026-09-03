import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Link from 'next/link'
import {
  RiCheckLine,
  RiCloseLine,
  RiUserLine,
  RiPhoneLine,
  RiWhatsappLine,
  RiMore2Fill,
  RiProfileLine,
  RiSearchLine,
  RiAddLine,
  RiMoneyDollarCircleLine,
  RiArrowRightSLine,
  RiForbidLine,
  RiLockUnlockLine,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import StatusPill from '@/components/ui/StatusPill'
import CreateUserDrawer from '@/components/Users/CreateUserDrawer'
import {
  getWorkers,
  approveWorker,
  rejectWorker,
  hideWorkerFromPublic,
  restoreWorkerVisibility,
} from '@/lib/services/workers'
import {
  desableUser,
  desableUserFirestore,
  getUserAvailability,
} from '@/lib/services/managers'
import {
  getAllWorkerPayments,
  getWorkerSubscriptionAmount,
  recordWorkerPayment,
  computeWorkerPaymentStatus,
} from '@/lib/services/workerPayments'
import { PAYMENT_STATUS_CONFIG } from './paymentStatusConfig'
import RecordPaymentModal from './RecordPaymentModal'
import WorkerRevenueChart from './WorkerRevenueChart'
import DesableConfirmModal from '@/components/DesableConfirm'
import PaginationButton from '@/components/Orders/PaginationButton'
import { firebaseDateFormat } from '@/utils/date'

const PAGE_SIZE = 10

const STATUS_FILTERS = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvés' },
  { value: 'rejected', label: 'Rejetés' },
]

const REVENUE_TAB = { value: 'revenue', label: 'Revenus' }

function ActionRow({ as = 'a', icon: Icon, iconColor, iconBg, label, tone, ...props }) {
  const Tag = as
  const labelColor = tone === 'danger' ? '#DC2626' : '#374151'
  return (
    <Tag
      {...props}
      type={as === 'button' ? 'button' : undefined}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
    >
      <span
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color: iconColor }} />
      </span>
      <span className="flex-1 text-sm font-semibold" style={{ color: labelColor }}>
        {label}
      </span>
      <RiArrowRightSLine className="h-4 w-4 flex-shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
    </Tag>
  )
}

function ActionsModal({
  worker,
  open,
  setOpen,
  onApprove,
  onReject,
  onToggleBlock,
  onRecordPayment,
}) {
  const colors = useColors()
  if (!worker) return null
  const status = worker.status || 'pending'

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
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all">
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                  >
                    {(worker.name?.[0] || 'O').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <Dialog.Title className="truncate text-sm font-bold text-gray-900">
                      {worker.name}
                    </Dialog.Title>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Choisir une action
                    </p>
                  </div>
                </div>

                <div className="space-y-0.5 p-2">
                  <Link href={`/workers/${worker.id}`} passHref legacyBehavior>
                    <ActionRow
                      icon={RiProfileLine}
                      iconColor={colors.gray600}
                      iconBg={colors.gray100}
                      label="Voir détail (réalisations, avis)"
                    />
                  </Link>

                  {status === 'pending' && (
                    <>
                      <ActionRow
                        as="button"
                        onClick={onApprove}
                        icon={RiCheckLine}
                        iconColor={colors.primary}
                        iconBg={colors.primaryVeryLight}
                        label="Approuver le profil"
                      />
                      <ActionRow
                        as="button"
                        onClick={onReject}
                        icon={RiCloseLine}
                        iconColor={colors.gray500}
                        iconBg={colors.gray100}
                        label="Rejeter le profil"
                        tone="danger"
                      />
                    </>
                  )}

                  {status === 'approved' && (
                    <ActionRow
                      as="button"
                      onClick={onRecordPayment}
                      icon={RiMoneyDollarCircleLine}
                      iconColor={colors.primary}
                      iconBg={colors.primaryVeryLight}
                      label="Enregistrer un paiement"
                    />
                  )}

                  {(status === 'approved' || worker.suspendedByAdmin) && worker.userId && (
                    <ActionRow
                      as="button"
                      onClick={onToggleBlock}
                      icon={worker.isAvailable ? RiForbidLine : RiLockUnlockLine}
                      iconColor={worker.isAvailable ? '#D97706' : colors.primary}
                      iconBg={worker.isAvailable ? '#FEF3C7' : colors.primaryVeryLight}
                      label={worker.isAvailable ? 'Bloquer le compte' : 'Débloquer le compte'}
                      tone={worker.isAvailable ? 'danger' : undefined}
                    />
                  )}

                  {status === 'rejected' && !worker.suspendedByAdmin && (
                    <p className="px-3 py-2.5 text-sm text-gray-400">
                      Aucune action disponible
                    </p>
                  )}
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

export default function WorkersPage() {
  const colors = useColors()
  const [workers, setWorkers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [actioningId, setActioningId] = useState(null)
  const [blockTarget, setBlockTarget] = useState(null)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [actionsTarget, setActionsTarget] = useState(null)
  const [actionsModalOpen, setActionsModalOpen] = useState(false)
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [subscriptionAmount, setSubscriptionAmount] = useState(0)
  const [paymentTarget, setPaymentTarget] = useState(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [payments, setPayments] = useState([])
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkActing, setBulkActing] = useState(false)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
    setSelectedIds(new Set())
  }, [statusFilter, searchTerm])

  useEffect(() => {
    getWorkerSubscriptionAmount().then(setSubscriptionAmount).catch(() => {})
  }, [])

  const fetchWorkersData = async () => {
    setIsLoading(true)
    try {
      const [data, allPayments] = await Promise.all([getWorkers(), getAllWorkerPayments()])
      const withAvailability = await Promise.all(
        data.map(async (w) => ({
          ...w,
          isAvailable: await getUserAvailability(w.userId),
          paymentStatus: computeWorkerPaymentStatus(
            w,
            allPayments.filter((p) => p.workerId === w.id)
          ),
        }))
      )
      setWorkers(withAvailability)
      setPayments(allPayments)
    } catch (err) {
      console.error(err)
      notify('Erreur lors du chargement des ouvriers', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkersData()
  }, [])

  const handleApprove = async (worker) => {
    setActioningId(worker.id)
    try {
      await approveWorker(worker.id, worker.userId)
      const approvedAt = new Date()
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === worker.id
            ? {
                ...w,
                status: 'approved',
                approvedAt,
                paymentStatus: computeWorkerPaymentStatus({ ...w, status: 'approved', approvedAt }, []),
              }
            : w
        )
      )
      notify('Ouvrier approuvé', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setActioningId(null)
    setActionsModalOpen(false)
  }

  const handleReject = async (worker) => {
    setActioningId(worker.id)
    try {
      await rejectWorker(worker.id)
      setWorkers((prev) =>
        prev.map((w) => (w.id === worker.id ? { ...w, status: 'rejected' } : w))
      )
      notify('Ouvrier rejeté', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setActioningId(null)
    setActionsModalOpen(false)
  }

  const setWorkerBlockedState = async (worker, blocked) => {
    await desableUser(worker.userId, blocked)
    await desableUserFirestore(worker.userId, !blocked)
    if (blocked) {
      await hideWorkerFromPublic(worker.id)
    } else {
      await restoreWorkerVisibility(worker.id)
    }
  }

  const handleToggleBlock = async () => {
    if (!blockTarget) return
    const nextAvailable = !blockTarget.isAvailable
    try {
      await setWorkerBlockedState(blockTarget, !nextAvailable)
      setWorkers((prev) =>
        prev.map((w) =>
          w.id === blockTarget.id
            ? {
                ...w,
                isAvailable: nextAvailable,
                ...(nextAvailable
                  ? { status: 'approved', suspendedByAdmin: false }
                  : { status: 'rejected', suspendedByAdmin: true }),
              }
            : w
        )
      )
      notify('Action effectuée avec succès', 'success')
      setBlockModalOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const handleBulkApprove = async () => {
    const targets = filtered.filter((w) => selectedIds.has(w.id))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      await Promise.all(targets.map((w) => approveWorker(w.id, w.userId)))
      const approvedAt = new Date()
      const targetIds = new Set(targets.map((w) => w.id))
      setWorkers((prev) =>
        prev.map((w) =>
          targetIds.has(w.id)
            ? {
                ...w,
                status: 'approved',
                approvedAt,
                paymentStatus: computeWorkerPaymentStatus({ ...w, status: 'approved', approvedAt }, []),
              }
            : w
        )
      )
      notify(`${targets.length} ouvrier(s) approuvé(s)`, 'success')
      setSelectedIds(new Set())
    } catch (e) {
      notify("Erreur lors de l'approbation groupée", 'error')
    }
    setBulkActing(false)
  }

  const handleBulkReject = async () => {
    const targets = filtered.filter((w) => selectedIds.has(w.id))
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      await Promise.all(targets.map((w) => rejectWorker(w.id)))
      const targetIds = new Set(targets.map((w) => w.id))
      setWorkers((prev) => prev.map((w) => (targetIds.has(w.id) ? { ...w, status: 'rejected' } : w)))
      notify(`${targets.length} ouvrier(s) rejeté(s)`, 'success')
      setSelectedIds(new Set())
    } catch (e) {
      notify('Erreur lors du rejet groupé', 'error')
    }
    setBulkActing(false)
  }

  const handleBulkBlock = async (blocked) => {
    const targets = filtered.filter((w) => selectedIds.has(w.id) && w.userId)
    if (targets.length === 0) return
    setBulkActing(true)
    try {
      await Promise.all(targets.map((w) => setWorkerBlockedState(w, blocked)))
      const targetIds = new Set(targets.map((w) => w.id))
      setWorkers((prev) =>
        prev.map((w) =>
          targetIds.has(w.id)
            ? {
                ...w,
                isAvailable: !blocked,
                ...(blocked
                  ? { status: 'rejected', suspendedByAdmin: true }
                  : { status: 'approved', suspendedByAdmin: false }),
              }
            : w
        )
      )
      notify(
        blocked ? `${targets.length} ouvrier(s) bloqué(s)` : `${targets.length} ouvrier(s) débloqué(s)`,
        'success'
      )
      setSelectedIds(new Set())
    } catch (e) {
      notify("Erreur lors de l'action groupée", 'error')
    }
    setBulkActing(false)
  }

  const handleRecordPayment = async (amount, paidAt, monthsCovered) => {
    if (!paymentTarget) return
    try {
      await recordWorkerPayment(paymentTarget.id, amount, paidAt, monthsCovered)
      const allPayments = await getAllWorkerPayments()
      setWorkers((prev) =>
        prev.map((w) => ({
          ...w,
          paymentStatus: computeWorkerPaymentStatus(
            w,
            allPayments.filter((p) => p.workerId === w.id)
          ),
        }))
      )
      setPayments(allPayments)
      notify('Paiement enregistré', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filtered = workers.filter((w) => {
    const matchStatus = (w.status || 'pending') === statusFilter
    if (!matchStatus) return false
    if (!searchTerm) return true
    const lower = searchTerm.toLowerCase()
    return (
      w.name?.toLowerCase().includes(lower) ||
      w.phone?.toLowerCase().includes(lower) ||
      (w.specialties || []).some((s) => s?.toLowerCase().includes(lower)) ||
      (w.communes || []).some((c) => c?.toLowerCase().includes(lower))
    )
  })
  const visible = filtered.slice(0, visibleCount)

  // Sélectionnable dépend de l'action groupée disponible pour l'onglet actif :
  // pending -> approuver/rejeter, approved -> bloquer, rejected -> débloquer
  // (uniquement les comptes bloqués par un admin, pas les vraies candidatures rejetées).
  const isBulkSelectable = (w) => {
    if (statusFilter === 'pending') return true
    if (statusFilter === 'approved') return !!w.userId
    if (statusFilter === 'rejected') return !!w.suspendedByAdmin && !!w.userId
    return false
  }
  const selectableIds = filtered.filter(isBulkSelectable).map((w) => w.id)
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

  return (
    <div className="mx-auto px-4 py-6 sm:px-6 md:px-8">
      <DesableConfirmModal
        title="Bloquer l'ouvrier"
        desable={blockTarget?.isAvailable}
        message={
          blockTarget?.isAvailable
            ? "Bloquer cet ouvrier l'empêchera de se connecter et son profil ne sera plus visible."
            : 'Débloquer cet ouvrier lui redonnera accès à son compte.'
        }
        confirmFunction={handleToggleBlock}
        open={blockModalOpen}
        setOpen={setBlockModalOpen}
      />

      <ActionsModal
        worker={actionsTarget}
        open={actionsModalOpen}
        setOpen={setActionsModalOpen}
        onApprove={() => handleApprove(actionsTarget)}
        onReject={() => handleReject(actionsTarget)}
        onToggleBlock={() => {
          setActionsModalOpen(false)
          setBlockTarget(actionsTarget)
          setBlockModalOpen(true)
        }}
        onRecordPayment={() => {
          setActionsModalOpen(false)
          setPaymentTarget(actionsTarget)
          setPaymentModalOpen(true)
        }}
      />

      <RecordPaymentModal
        open={paymentModalOpen}
        setOpen={setPaymentModalOpen}
        defaultAmount={subscriptionAmount}
        onConfirm={handleRecordPayment}
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Ouvriers</h2>
            <p className="mt-1 text-sm text-gray-500">
              Profils d'artisans/ouvriers inscrits depuis le site public
            </p>
          </div>
          {statusFilter !== REVENUE_TAB.value && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <RiSearchLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher nom, spécialité, zone..."
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setCreateDrawerOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:translate-y-px"
                style={{ backgroundColor: colors.primary }}
              >
                <RiAddLine className="h-4 w-4" />
                Ajouter un Ouvrier
              </button>
            </div>
          )}
        </div>

        <CreateUserDrawer
          open={createDrawerOpen}
          setOpen={setCreateDrawerOpen}
          defaultRole="worker"
          onCreate={() => {
            fetchWorkersData()
          }}
        />

        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {[...STATUS_FILTERS, REVENUE_TAB].map((f) => {
            const isRevenueTab = f.value === REVENUE_TAB.value
            const count = isRevenueTab
              ? null
              : workers.filter((w) => (w.status || 'pending') === f.value).length
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
                {count !== null && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-xs"
                    style={
                      active
                        ? {
                            backgroundColor: colors.primaryVeryLight,
                            color: colors.primary,
                          }
                        : {
                            backgroundColor: colors.gray100,
                            color: colors.gray500,
                          }
                    }
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {statusFilter !== REVENUE_TAB.value && selectedIds.size > 0 && (
          <div
            className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-3"
            style={{ borderColor: colors.primary, backgroundColor: colors.primaryVeryLight }}
          >
            <span className="text-sm font-semibold" style={{ color: colors.primary }}>
              {selectedIds.size} ouvrier{selectedIds.size > 1 ? 's' : ''} sélectionné
              {selectedIds.size > 1 ? 's' : ''}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {statusFilter === 'pending' && (
                <>
                  <button
                    type="button"
                    disabled={bulkActing}
                    onClick={handleBulkApprove}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-60"
                    style={{ color: colors.primary }}
                  >
                    Approuver
                  </button>
                  <button
                    type="button"
                    disabled={bulkActing}
                    onClick={handleBulkReject}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Rejeter
                  </button>
                </>
              )}
              {statusFilter === 'approved' && (
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkBlock(true)}
                  className="rounded-lg border bg-white px-3 py-1.5 text-xs font-semibold hover:bg-amber-50 disabled:opacity-60"
                  style={{ borderColor: colors.warning, color: colors.warning }}
                >
                  Bloquer
                </button>
              )}
              {statusFilter === 'rejected' && (
                <button
                  type="button"
                  disabled={bulkActing}
                  onClick={() => handleBulkBlock(false)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-60"
                  style={{ color: colors.primary }}
                >
                  Débloquer
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {statusFilter === REVENUE_TAB.value ? (
          <WorkerRevenueChart payments={payments} isLoading={isLoading} />
        ) : isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiUserLine className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              Aucun ouvrier dans cette catégorie
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>
                    <th scope="col" className="w-8 px-4 py-3">
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
                      { label: 'Ouvrier' },
                      { label: 'Spécialités', secondary: true },
                      { label: 'Zones', secondary: true },
                      { label: 'Contact' },
                      { label: 'Statut' },
                      { label: 'Abonnement' },
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
                  {visible.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="w-8 px-4 py-4">
                        {isBulkSelectable(worker) && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(worker.id)}
                            onChange={() => toggleSelect(worker.id)}
                            className="h-4 w-4 cursor-pointer rounded"
                            style={{ accentColor: colors.primary }}
                          />
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                            {worker.imageUrl ? (
                              <img
                                src={worker.imageUrl}
                                alt={worker.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <RiUserLine className="h-4 w-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {worker.name}
                            </p>
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              {worker.accountType === 'enterprise'
                                ? 'Entreprise'
                                : 'Particulier'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-6 py-3 lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {(worker.specialties || []).map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="hidden px-6 py-3 lg:table-cell">
                        <p className="text-xs text-gray-500">
                          {(worker.communes || []).join(', ') || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-3">
                        {worker.phone && (
                          <p className="flex items-center gap-1 font-mono text-xs text-gray-500">
                            <RiPhoneLine className="h-3.5 w-3.5" />{' '}
                            {worker.phone}
                          </p>
                        )}
                        {worker.whatsapp && (
                          <p className="mt-1 flex items-center gap-1 font-mono text-xs text-gray-500">
                            <RiWhatsappLine className="h-3.5 w-3.5" />{' '}
                            {worker.whatsapp}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {worker.suspendedByAdmin ? (
                          <StatusPill
                            tone="warning"
                          >
                            Suspendu
                          </StatusPill>
                        ) : (
                          <StatusPill tone={worker.isAvailable ? 'success' : 'error'}>
                            {worker.isAvailable ? 'Actif' : 'Bloqué'}
                          </StatusPill>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {worker.paymentStatus?.status !== 'unknown' && (
                          <>
                            <StatusPill tone={PAYMENT_STATUS_CONFIG[worker.paymentStatus.status].tone}>
                              {PAYMENT_STATUS_CONFIG[worker.paymentStatus.status].label}
                            </StatusPill>
                            <p className="mt-1 font-mono text-[11px] text-gray-400">
                              {worker.paymentStatus.status === 'trial'
                                ? `Essai jusqu'au ${firebaseDateFormat(worker.paymentStatus.trialEndAt)}`
                                : worker.paymentStatus.nextDueAt
                                ? `Échéance ${firebaseDateFormat(worker.paymentStatus.nextDueAt)}`
                                : ''}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {actioningId === worker.id ? (
                          <Loader color="#111827" />
                        ) : (
                          <button
                            onClick={() => {
                              setActionsTarget(worker)
                              setActionsModalOpen(true)
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            title="Actions"
                          >
                            <RiMore2Fill className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visibleCount < filtered.length && (
              <PaginationButton
                getmoreData={() => setVisibleCount((c) => c + PAGE_SIZE)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
