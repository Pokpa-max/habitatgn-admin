import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiAddLine, RiCheckLine, RiDeleteBinLine, RiBillLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF, currentPeriod, formatPeriodLabel } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import Loader from '@/components/Loader'
import DrawerForm from '@/components/DrawerForm'
import PaginationButton from '@/components/Orders/PaginationButton'
import { getManagedProperties, getPropertiesByOwner } from '@/lib/services/managedProperties'
import { getPropertyExpenses, addPropertyExpense, deletePropertyExpense } from '@/lib/services/propertyExpenses'
import { useCanManage } from '@/hooks/useCanManage'

const CATEGORIES = ['Taxe', 'Assurance', 'Réparation', 'Autre']

const PAGE_SIZE = 10

export default function DepensesTab({ ownerId }) {
  const colors = useColors()
  const canPayments = useCanManage('properties', 'payments')
  const canDelete = useCanManage('properties', 'delete')
  const [expenses, setExpenses] = useState([])
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState('all')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [expensesData, propertiesData] = await Promise.all([
          getPropertyExpenses(),
          ownerId ? getPropertiesByOwner(ownerId) : getManagedProperties(),
        ])
        const propertyIds = new Set(propertiesData.map((p) => p.id))
        setExpenses(ownerId ? expensesData.filter((e) => propertyIds.has(e.propertyId)) : expensesData)
        setProperties(propertiesData)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [ownerId])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [propertyFilter])

  const propertyById = (id) => properties.find((p) => p.id === id)

  const openAdd = () => {
    if (!canPayments) return
    reset({
      propertyId: properties[0]?.id || '',
      period: currentPeriod(),
      label: '',
      category: 'Réparation',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
    })
    setDrawerOpen(true)
  }

  const onSubmit = async (data) => {
    if (!canPayments) return
    setSaving(true)
    try {
      const payload = {
        propertyId: data.propertyId,
        period: data.period,
        label: data.label,
        category: data.category,
        amount: Number(data.amount) || 0,
        date: data.date,
      }
      const saved = await addPropertyExpense(payload)
      setExpenses((prev) => [saved, ...prev])
      notify('Dépense ajoutée avec succès', 'success')
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const handleDelete = async (expense) => {
    if (!canDelete) return
    try {
      await deletePropertyExpense(expense.id)
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id))
      setDeleteConfirm(null)
      notify('Dépense supprimée', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filtered = expenses.filter((e) => propertyFilter === 'all' || e.propertyId === propertyFilter)
  const total = filtered.reduce((sum, e) => sum + (e.amount || 0), 0)
  const visible = filtered.slice(0, visibleCount)

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Dépenses</h2>
            <p className="mt-1 text-sm text-gray-500">Total affiché : {formatGNF(total)}</p>
          </div>
          <div className="flex items-center gap-2">
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
            {canPayments && (
              <button
                onClick={openAdd}
                disabled={properties.length === 0}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                <RiAddLine className="h-4 w-4" />
                Ajouter une dépense
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiBillLine className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-400">Aucune dépense enregistrée</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700">Date</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700">Bien</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700">Libellé</th>
                    <th className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700 lg:table-cell">Catégorie</th>
                    <th className="hidden px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700 lg:table-cell">Mois</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-700">Montant</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {visible.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-gray-500">
                        {expense.date ? firebaseDateFormat(new Date(expense.date)) : '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{propertyById(expense.propertyId)?.reference || '—'}</td>
                      <td className="px-6 py-3 text-gray-700">{expense.label}</td>
                      <td className="hidden px-6 py-3 text-gray-500 lg:table-cell">{expense.category}</td>
                      <td className="hidden px-6 py-3 font-mono text-gray-500 lg:table-cell">{formatPeriodLabel(expense.period)}</td>
                      <td className="whitespace-nowrap px-6 py-3 font-mono font-semibold text-gray-900">{formatGNF(expense.amount)}</td>
                      <td className="px-6 py-3">
                        {canDelete && (
                          deleteConfirm === expense.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete(expense)}
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
                              onClick={() => setDeleteConfirm(expense.id)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:bg-red-50"
                              title="Supprimer"
                            >
                              <RiDeleteBinLine className="h-4 w-4" />
                            </button>
                          )
                        )}
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

      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title="Ajouter une dépense"
        description="Taxe, assurance, réparation ou autre charge liée au bien"
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
              Bien *
            </label>
            <select
              {...register('propertyId', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.address}
                  {p.unitLabel ? ` (${p.unitLabel})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Libellé *
            </label>
            <input
              type="text"
              {...register('label', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Taxe foncière 2026"
            />
            {errors.label && <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.label.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Catégorie
              </label>
              <select
                {...register('category')}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Montant (GNF) *
              </label>
              <input
                type="number"
                {...register('amount', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.amount && <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Date
              </label>
              <input
                type="date"
                {...register('date', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Mois imputé *
              </label>
              <input
                type="month"
                {...register('period', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </DrawerForm>
    </>
  )
}
