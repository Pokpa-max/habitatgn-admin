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
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
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
                <div className="border-b border-gray-100 px-6 py-5">
                  <Dialog.Title className="text-sm font-bold text-gray-900">
                    {worker.name}
                  </Dialog.Title>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Choisir une action
                  </p>
                </div>

                <div className="space-y-1 p-2">
                  <Link href={`/workers/${worker.id}`}>
                    <a className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50">
                      <RiProfileLine className="h-4 w-4 text-gray-400" />
                      Voir détail (réalisations, avis)
                    </a>
                  </Link>

                  {status === 'pending' && (
                    <>
                      <button
                        onClick={onApprove}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <RiCheckLine
                          className="h-4 w-4"
                          style={{ color: colors.primary }}
                        />
                        Approuver le profil
                      </button>
                      <button
                        onClick={onReject}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <RiCloseLine className="h-4 w-4 text-gray-400" />
                        Rejeter le profil
                      </button>
                    </>
                  )}

                  {status === 'approved' && (
                    <button
                      onClick={onRecordPayment}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <RiMoneyDollarCircleLine
                        className="h-4 w-4"
                        style={{ color: colors.primary }}
                      />
                      Enregistrer un paiement
                    </button>
                  )}

                  {(status === 'approved' || worker.suspendedByAdmin) && worker.userId && (
                    <button
                      onClick={onToggleBlock}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: worker.isAvailable
                            ? colors.gray700
                            : colors.primary,
                        }}
                      />
                      {worker.isAvailable
                        ? 'Bloquer le compte'
                        : 'Débloquer le compte'}
                    </button>
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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
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

  const handleToggleBlock = async () => {
    if (!blockTarget) return
    const nextAvailable = !blockTarget.isAvailable
    try {
      await desableUser(blockTarget.userId, !nextAvailable)
      await desableUserFirestore(blockTarget.userId, nextAvailable)

      if (nextAvailable) {
        await restoreWorkerVisibility(blockTarget.id)
      } else {
        await hideWorkerFromPublic(blockTarget.id)
      }

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
                    {[
                      'Ouvrier',
                      'Spécialités',
                      'Zones',
                      'Contact',
                      'Statut',
                      'Abonnement',
                      'Actions',
                    ].map((h) => (
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
                  {visible.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
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
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-500">
                          {(worker.communes || []).join(', ') || '—'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {worker.phone && (
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <RiPhoneLine className="h-3.5 w-3.5" />{' '}
                            {worker.phone}
                          </p>
                        )}
                        {worker.whatsapp && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <RiWhatsappLine className="h-3.5 w-3.5" />{' '}
                            {worker.whatsapp}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {worker.suspendedByAdmin ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}
                            title="Compte bloqué par un admin — masqué du site public, distinct d'une candidature rejetée"
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#D97706' }} />
                            Suspendu
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: worker.isAvailable
                                ? colors.primaryVeryLight
                                : colors.gray100,
                              color: worker.isAvailable
                                ? colors.primaryDark
                                : colors.gray600,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor: worker.isAvailable
                                  ? colors.primary
                                  : colors.gray500,
                              }}
                            />
                            {worker.isAvailable ? 'Actif' : 'Bloqué'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {worker.paymentStatus?.status !== 'unknown' && (
                          <>
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor:
                                  PAYMENT_STATUS_CONFIG[worker.paymentStatus.status].bg,
                                color: PAYMENT_STATUS_CONFIG[worker.paymentStatus.status].color,
                              }}
                            >
                              {PAYMENT_STATUS_CONFIG[worker.paymentStatus.status].label}
                            </span>
                            <p className="mt-1 text-[11px] text-gray-400">
                              {worker.paymentStatus.status === 'trial'
                                ? `Essai jusqu'au ${firebaseDateFormat(worker.paymentStatus.trialEndAt)}`
                                : worker.paymentStatus.nextDueAt
                                ? `Échéance ${firebaseDateFormat(worker.paymentStatus.nextDueAt)}`
                                : ''}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
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
