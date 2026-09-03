import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiAddLine, RiCheckLine, RiDeleteBinLine, RiWallet3Line } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF, currentPeriod, formatPeriodLabel } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import Loader from '@/components/Loader'
import StatusPill from '@/components/ui/StatusPill'
import DrawerForm from '@/components/DrawerForm'
import PaginationButton from '@/components/Orders/PaginationButton'
import { getManagedProperties, getPropertiesByOwner } from '@/lib/services/managedProperties'
import { getLeases } from '@/lib/services/leases'
import { getRentPayments, addRentPayment, deleteRentPayment } from '@/lib/services/rentPayments'

const METHODS = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'autre', label: 'Autre' },
]

const PAGE_SIZE = 10

function statusForPeriod(due, paid, period) {
  const isFuture = period > currentPeriod()
  if (paid <= 0) return isFuture ? { label: '—', tone: 'gray' } : { label: 'Impayé', tone: 'error' }
  if (isFuture) return { label: 'Avance', tone: 'primary' }
  if (paid < due) return { label: 'Partiel', tone: 'warning' }
  return { label: 'Payé', tone: 'success' }
}

export default function PaiementsTab({ ownerId }) {
  const colors = useColors()
  const [properties, setProperties] = useState([])
  const [leases, setLeases] = useState([])
  const [payments, setPayments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState(currentPeriod())
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  const watchedLeaseId = watch('leaseId')

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [propertiesData, leasesData, paymentsData] = await Promise.all([
          ownerId ? getPropertiesByOwner(ownerId) : getManagedProperties(),
          getLeases(),
          getRentPayments(),
        ])
        const propertyIds = new Set(propertiesData.map((p) => p.id))
        setProperties(propertiesData)
        setLeases(
          leasesData.filter((l) => l.status === 'active' && (!ownerId || propertyIds.has(l.propertyId)))
        )
        setPayments(ownerId ? paymentsData.filter((p) => propertyIds.has(p.propertyId)) : paymentsData)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [ownerId])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [propertyFilter, periodFilter])

  const propertyById = (id) => properties.find((p) => p.id === id)
  const leaseById = (id) => leases.find((l) => l.id === id)

  const activeLeases = leases.filter((l) => propertyFilter === 'all' || l.propertyId === propertyFilter)

  const openAdd = (prefill = {}) => {
    reset({
      leaseId: prefill.leaseId || activeLeases[0]?.id || '',
      period: prefill.period || periodFilter,
      amountDue: prefill.amountDue || '',
      amountPaid: '',
      paymentDate: new Date().toISOString().slice(0, 10),
      method: 'especes',
      note: '',
    })
    setDrawerOpen(true)
  }

  useEffect(() => {
    if (!watchedLeaseId) return
    const lease = leaseById(watchedLeaseId)
    if (lease) setValue('amountDue', lease.rentAmount)
  }, [watchedLeaseId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const lease = leaseById(data.leaseId)
      const payload = {
        leaseId: data.leaseId,
        propertyId: lease?.propertyId,
        period: data.period,
        amountDue: Number(data.amountDue) || 0,
        amountPaid: Number(data.amountPaid) || 0,
        paymentDate: data.paymentDate,
        method: data.method,
        note: data.note,
      }
      const saved = await addRentPayment(payload)
      setPayments((prev) => [saved, ...prev])
      notify('Paiement enregistré avec succès', 'success')
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async (payment) => {
    try {
      await deleteRentPayment(payment.id)
      setPayments((prev) => prev.filter((p) => p.id !== payment.id))
      setDeleteConfirm(null)
      notify('Paiement supprimé', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filteredPayments = payments.filter((p) => {
    if (propertyFilter !== 'all' && p.propertyId !== propertyFilter) return false
    if (periodFilter && p.period !== periodFilter) return false
    return true
  })
  const visiblePayments = filteredPayments.slice(0, visibleCount)

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Paiements</h2>
            <p className="mt-1 text-sm text-gray-500">Loyers, avances et retards par bail</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="rounded-xl border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Tous les biens</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.address}
                  {p.unitLabel ? ` (${p.unitLabel})` : ''}
                </option>
              ))}
            </select>
            <input
              type="month"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="rounded-xl border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => openAdd()}
              disabled={activeLeases.length === 0}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              <RiAddLine className="h-4 w-4" />
              Enregistrer un paiement
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : (
          <>
            {/* Résumé du mois sélectionné, par bail actif */}
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Situation — {formatPeriodLabel(periodFilter)}
              </p>
              {activeLeases.length === 0 ? (
                <p className="text-sm text-gray-400">Aucun bail actif pour ce filtre</p>
              ) : (
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                  {activeLeases.map((lease) => {
                    const property = propertyById(lease.propertyId)
                    const due = lease.rentAmount || 0
                    const paid = payments
                      .filter((p) => p.leaseId === lease.id && p.period === periodFilter)
                      .reduce((sum, p) => sum + (p.amountPaid || 0), 0)
                    const status = statusForPeriod(due, paid, periodFilter)
                    return (
                      <div key={lease.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {lease.tenantName} — {property?.reference}
                          </p>
                          <p className="font-mono text-xs text-gray-500">
                            {formatGNF(paid)} / {formatGNF(due)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusPill tone={status.tone}>{status.label}</StatusPill>
                          <button
                            onClick={() => openAdd({ leaseId: lease.id, period: periodFilter, amountDue: due })}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Encaisser
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Historique des paiements */}
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Historique</p>
            {filteredPayments.length === 0 ? (
              <div className="flex h-24 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
                <RiWallet3Line className="h-6 w-6 text-gray-300" />
                <p className="text-sm text-gray-400">Aucun paiement pour ce filtre</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead style={{ backgroundColor: colors.gray50 }}>
                      <tr>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Date</th>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Bien / Locataire</th>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Mois</th>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Montant</th>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Méthode</th>
                        <th className="px-6 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {visiblePayments.map((payment) => {
                        const lease = leaseById(payment.leaseId)
                        const property = propertyById(payment.propertyId)
                        const status = statusForPeriod(payment.amountDue, payment.amountPaid, payment.period)
                        return (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-3 font-mono text-gray-500">
                              {payment.paymentDate ? firebaseDateFormat(new Date(payment.paymentDate)) : '—'}
                            </td>
                            <td className="px-6 py-3 text-gray-700">
                              {property?.reference} — {lease?.tenantName || '—'}
                            </td>
                            <td className="px-6 py-3 font-mono text-gray-700">
                              {formatPeriodLabel(payment.period)}
                              <span className="ml-2 inline-block align-middle">
                                <StatusPill tone={status.tone}>{status.label}</StatusPill>
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-3 font-mono font-semibold" style={{ color: colors.primary }}>
                              {formatGNF(payment.amountPaid)}
                            </td>
                            <td className="px-6 py-3 text-gray-500">
                              {METHODS.find((m) => m.value === payment.method)?.label || payment.method}
                            </td>
                            <td className="px-6 py-3">
                              {deleteConfirm === payment.id ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleDelete(payment)}
                                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                                    style={{ backgroundColor: colors.error }}
                                  >
                                    Oui
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                  >
                                    Non
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(payment.id)}
                                  className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-red-50"
                                  title="Supprimer"
                                >
                                  <RiDeleteBinLine className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {visibleCount < filteredPayments.length && (
                  <PaginationButton getmoreData={() => setVisibleCount((c) => c + PAGE_SIZE)} />
                )}
              </div>
            )}
          </>
        )}
      </div>

      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title="Enregistrer un paiement"
        description="Loyer, avance ou régularisation d'un mois"
        footerButtons={
          <>
            {saving ? (
              <div
                className="inline-flex justify-center rounded px-6 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: colors.primary }}
              >
                <Loader />
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded border border-gray-300 bg-white px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() => setDrawerOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center gap-2 rounded px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
                  style={{ backgroundColor: colors.primary }}
                >
                  <RiCheckLine className="h-4 w-4" />
                  Enregistrer
                </button>
              </>
            )}
          </>
        }
      >
        <div className="space-y-5 px-6 py-6 sm:p-8">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Bail *
            </label>
            <select
              {...register('leaseId', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {activeLeases.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.tenantName} — {propertyById(l.propertyId)?.reference}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Mois concerné *
            </label>
            <input
              type="month"
              {...register('period', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-gray-400">Choisir un mois futur pour enregistrer une avance.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Montant dû (GNF)
              </label>
              <input
                type="number"
                {...register('amountDue')}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Montant payé (GNF) *
              </label>
              <input
                type="number"
                {...register('amountPaid', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.amountPaid && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.amountPaid.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Date du paiement *
              </label>
              <input
                type="date"
                {...register('paymentDate', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Méthode
              </label>
              <select
                {...register('method')}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Note
            </label>
            <textarea
              rows={2}
              {...register('note')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </DrawerForm>
    </>
  )
}
