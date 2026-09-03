import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiAddLine, RiEditLine, RiFileTextLine, RiCheckLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import Loader from '@/components/Loader'
import StatusPill from '@/components/ui/StatusPill'
import DrawerForm from '@/components/DrawerForm'
import { getManagedProperties, getPropertiesByOwner, editManagedProperty } from '@/lib/services/managedProperties'
import { getLeases, addLease, editLease } from '@/lib/services/leases'

const STATUS_CONFIG = {
  active: { label: 'Actif', tone: 'success' },
  ended: { label: 'Terminé', tone: 'gray' },
  terminated: { label: 'Résilié', tone: 'error' },
}

export default function BauxTab({ ownerId }) {
  const colors = useColors()
  const [leases, setLeases] = useState([])
  const [properties, setProperties] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState('all')

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
        const [leasesData, propertiesData] = await Promise.all([
          getLeases(),
          ownerId ? getPropertiesByOwner(ownerId) : getManagedProperties(),
        ])
        const propertyIds = new Set(propertiesData.map((p) => p.id))
        setLeases(ownerId ? leasesData.filter((l) => propertyIds.has(l.propertyId)) : leasesData)
        setProperties(propertiesData)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [ownerId])

  const propertyById = (id) => properties.find((p) => p.id === id)

  const openAdd = () => {
    setSelected(null)
    reset({
      propertyId: properties[0]?.id || '',
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      rentAmount: '',
      depositAmount: '',
      startDate: '',
      endDate: '',
      notes: '',
    })
    setDrawerOpen(true)
  }

  const openEdit = (lease) => {
    setSelected(lease)
    reset({
      propertyId: lease.propertyId,
      tenantName: lease.tenantName,
      tenantPhone: lease.tenantPhone,
      tenantEmail: lease.tenantEmail || '',
      rentAmount: lease.rentAmount,
      depositAmount: lease.depositAmount || '',
      startDate: lease.startDate || '',
      endDate: lease.endDate || '',
      notes: lease.notes || '',
    })
    setDrawerOpen(true)
  }

  const setPropertyStatus = async (propertyId, status) => {
    await editManagedProperty(propertyId, { status })
    setProperties((prev) => prev.map((p) => (p.id === propertyId ? { ...p, status } : p)))
  }

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = {
        propertyId: data.propertyId,
        tenantName: data.tenantName,
        tenantPhone: data.tenantPhone,
        tenantEmail: data.tenantEmail,
        rentAmount: Number(data.rentAmount) || 0,
        depositAmount: Number(data.depositAmount) || 0,
        startDate: data.startDate,
        endDate: data.endDate || null,
        notes: data.notes,
      }

      if (selected) {
        await editLease(selected.id, payload)
        setLeases((prev) => prev.map((l) => (l.id === selected.id ? { ...l, ...payload } : l)))
        notify('Bail modifié avec succès', 'success')
      } else {
        const saved = await addLease({ ...payload, status: 'active' })
        setLeases((prev) => [saved, ...prev])
        await setPropertyStatus(data.propertyId, 'occupied')
        notify('Bail ajouté avec succès', 'success')
      }
      setDrawerOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  const endLease = async (lease, status) => {
    try {
      await editLease(lease.id, { status })
      setLeases((prev) => prev.map((l) => (l.id === lease.id ? { ...l, status } : l)))
      const stillActive = leases.some(
        (l) => l.id !== lease.id && l.propertyId === lease.propertyId && l.status === 'active'
      )
      if (!stillActive) await setPropertyStatus(lease.propertyId, 'vacant')
      notify('Bail mis à jour', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filtered = leases.filter((l) => propertyFilter === 'all' || l.propertyId === propertyFilter)

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Locataires & baux</h2>
            <p className="mt-1 text-sm text-gray-500">
              {leases.length} bail{leases.length !== 1 ? 'x' : ''} enregistré{leases.length !== 1 ? 's' : ''}
            </p>
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
            <button
              onClick={openAdd}
              disabled={properties.length === 0}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              <RiAddLine className="h-4 w-4" />
              Ajouter un bail
            </button>
          </div>
        </div>

        {properties.length === 0 && !isLoading && (
          <p className="mb-4 text-sm text-gray-400">
            Ajoutez d'abord un bien dans l'onglet "Biens gérés" avant de créer un bail.
          </p>
        )}

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiFileTextLine className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-400">Aucun bail enregistré</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead style={{ backgroundColor: colors.gray50 }}>
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Bien</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Locataire</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Loyer</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Début</th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700">Statut</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filtered.map((lease) => {
                    const property = propertyById(lease.propertyId)
                    const statusCfg = STATUS_CONFIG[lease.status] || STATUS_CONFIG.active
                    return (
                      <tr key={lease.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-700">
                          {property
                            ? `${property.reference} — ${property.address}${property.unitLabel ? ` (${property.unitLabel})` : ''}`
                            : '—'}
                        </td>
                        <td className="px-6 py-3 text-gray-700">
                          {lease.tenantName}
                          <p className="font-mono text-xs text-gray-400">{lease.tenantPhone}</p>
                        </td>
                        <td className="px-6 py-3 font-mono font-semibold" style={{ color: colors.primary }}>
                          {formatGNF(lease.rentAmount)}
                        </td>
                        <td className="px-6 py-3 font-mono text-gray-500">
                          {lease.startDate ? firebaseDateFormat(new Date(lease.startDate)) : '—'}
                        </td>
                        <td className="px-6 py-3">
                          <StatusPill tone={statusCfg.tone}>{statusCfg.label}</StatusPill>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(lease)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                              title="Modifier"
                            >
                              <RiEditLine className="h-4 w-4" />
                            </button>
                            {lease.status === 'active' && (
                              <button
                                onClick={() => endLease(lease, 'ended')}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                              >
                                Clôturer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <DrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        onSubmit={handleSubmit(onSubmit)}
        title={selected ? 'Modifier le bail' : 'Ajouter un bail'}
        description={selected ? 'Mettez à jour les informations du bail' : 'Enregistrer un nouveau bail'}
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
              disabled={!!selected}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.reference} — {p.address}
                  {p.unitLabel ? ` (${p.unitLabel})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Nom du locataire *
              </label>
              <input
                type="text"
                {...register('tenantName', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.tenantName && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.tenantName.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Téléphone *
              </label>
              <input
                type="text"
                {...register('tenantPhone', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+224 6XX XX XX XX"
              />
              {errors.tenantPhone && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.tenantPhone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Email
            </label>
            <input
              type="email"
              {...register('tenantEmail')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Loyer mensuel (GNF) *
              </label>
              <input
                type="number"
                {...register('rentAmount', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.rentAmount && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.rentAmount.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Caution (GNF)
              </label>
              <input
                type="number"
                {...register('depositAmount')}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Date de début *
              </label>
              <input
                type="date"
                {...register('startDate', { required: 'Requis' })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.startDate && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-900">
                Date de fin
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Notes
            </label>
            <textarea
              rows={2}
              {...register('notes')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </DrawerForm>
    </>
  )
}
