import { useEffect, useState } from 'react'
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiHome4Line, RiArrowRightSLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import Loader from '@/components/Loader'
import SimpleDrawer from '@/components/SimpleDrawer'
import PropertyDrawerForm from './PropertyDrawerForm'
import { getManagedProperties, getPropertiesByOwner, deleteManagedProperty } from '@/lib/services/managedProperties'
import { getPropertyOwners } from '@/lib/services/propertyOwners'
import { getLeasesByProperty } from '@/lib/services/leases'
import { getPaymentsByProperty } from '@/lib/services/rentPayments'
import { getTicketsByProperty } from '@/lib/services/maintenanceTickets'
import { getExpensesByProperty } from '@/lib/services/propertyExpenses'

const STATUS_CONFIG = {
  vacant: { label: 'Vacant', bg: '#FEF3C7', color: '#92400E' },
  occupied: { label: 'Occupé', bg: '#D1FAE5', color: '#065F46' },
  inactive: { label: 'Inactif', bg: '#F3F4F6', color: '#374151' },
}

// Si ownerId est fourni, la liste est restreinte aux biens de ce propriétaire
// et le formulaire d'ajout/édition lui verrouille automatiquement le propriétaire.
export default function BiensTab({ ownerId, onPropertiesChange }) {
  const colors = useColors()
  const [properties, setProperties] = useState([])
  const [owners, setOwners] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [search, setSearch] = useState('')
  const [detailProperty, setDetailProperty] = useState(null)
  const [showDeleteLink, setShowDeleteLink] = useState(false)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [propertiesData, ownersData] = await Promise.all([
          ownerId ? getPropertiesByOwner(ownerId) : getManagedProperties(),
          ownerId ? Promise.resolve([]) : getPropertyOwners(),
        ])
        setProperties(propertiesData)
        setOwners(ownersData)
      } catch (e) {
        notify('Erreur lors du chargement', 'error')
      }
      setIsLoading(false)
    }
    load()
  }, [ownerId])

  useEffect(() => {
    onPropertiesChange?.(properties)
  }, [properties]) // eslint-disable-line react-hooks/exhaustive-deps

  const ownerById = (id) => owners.find((o) => o.id === id)

  const openAdd = () => {
    setSelected(null)
    setDrawerOpen(true)
  }

  const openEdit = (property) => {
    setDetailProperty(null)
    setSelected(property)
    setDrawerOpen(true)
  }

  const openDetail = (property) => {
    setShowDeleteLink(false)
    setDeleteConfirm(null)
    setDetailProperty(property)
  }

  const handleSaved = (saved) => {
    setProperties((prev) => {
      const exists = prev.some((p) => p.id === saved.id)
      return exists ? prev.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...prev]
    })
  }

  const handleOwnerCreated = (owner) => {
    setOwners((prev) => [owner, ...prev])
  }

  const handleDelete = async (property) => {
    try {
      const [leases, payments, tickets, expenses] = await Promise.all([
        getLeasesByProperty(property.id),
        getPaymentsByProperty(property.id),
        getTicketsByProperty(property.id),
        getExpensesByProperty(property.id),
      ])
      if (leases.length > 0 || payments.length > 0 || tickets.length > 0 || expenses.length > 0) {
        notify(
          "Impossible de supprimer : ce bien a un historique (bail, paiement, entretien ou dépense) rattaché",
          'error'
        )
        setDeleteConfirm(null)
        return
      }
      await deleteManagedProperty(property.id)
      setProperties((prev) => prev.filter((p) => p.id !== property.id))
      setDeleteConfirm(null)
      setDetailProperty(null)
      notify('Bien supprimé avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
  }

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase()
    if (!q) return true
    const owner = ownerById(p.ownerId)
    return (
      p.reference?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.unitLabel?.toLowerCase().includes(q) ||
      owner?.name?.toLowerCase().includes(q)
    )
  })

  return (
    <>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Biens gérés</h2>
            <p className="mt-1 text-sm text-gray-500">
              {properties.length} bien{properties.length !== 1 ? 's' : ''} enregistré
              {properties.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un bien..."
              className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-gray-400 focus:outline-none"
            />
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ backgroundColor: colors.primary }}
            >
              <RiAddLine className="h-4 w-4" />
              Ajouter un bien
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader color="#111827" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200">
            <RiHome4Line className="h-6 w-6 text-gray-300" />
            <p className="text-sm text-gray-400">Aucun bien enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4">Référence</th>
                  <th className="py-2 pr-4">Adresse</th>
                  {!ownerId && <th className="py-2 pr-4">Propriétaire</th>}
                  <th className="py-2 pr-4">Loyer</th>
                  <th className="py-2 pr-4">Statut</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((property) => {
                  const statusCfg = STATUS_CONFIG[property.status] || STATUS_CONFIG.vacant
                  const owner = ownerById(property.ownerId)
                  return (
                    <tr
                      key={property.id}
                      onClick={() => openDetail(property)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="py-3 pr-4 font-semibold text-gray-900">{property.reference}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {property.address}
                        {property.city ? `, ${property.city}` : ''}
                        {property.unitLabel && (
                          <span
                            className="ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                          >
                            {property.unitLabel}
                          </span>
                        )}
                        <p className="text-xs text-gray-400">{property.type}</p>
                      </td>
                      {!ownerId && (
                        <td className="py-3 pr-4 text-gray-700">
                          {owner?.name || '—'}
                          <p className="text-xs text-gray-400">{owner?.phone}</p>
                        </td>
                      )}
                      <td className="py-3 pr-4 font-semibold" style={{ color: colors.primary }}>
                        {formatGNF(property.rentAmount)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <RiArrowRightSLine className="ml-auto h-4 w-4" style={{ color: colors.gray400 }} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PropertyDrawerForm
        open={drawerOpen}
        setOpen={setDrawerOpen}
        selected={selected}
        owners={owners}
        lockedOwnerId={ownerId}
        onSaved={handleSaved}
        onOwnerCreated={handleOwnerCreated}
      />

      <SimpleDrawer
        open={!!detailProperty}
        setOpen={(open) => !open && setDetailProperty(null)}
        title={detailProperty?.reference}
        description={detailProperty ? `${detailProperty.address}${detailProperty.city ? `, ${detailProperty.city}` : ''}` : ''}
        footerButtons={
          <button
            onClick={() => openEdit(detailProperty)}
            className="inline-flex items-center gap-2 rounded px-6 py-2 text-sm font-semibold text-white hover:shadow-md"
            style={{ backgroundColor: colors.primary }}
          >
            <RiEditLine className="h-4 w-4" />
            Modifier
          </button>
        }
      >
        {detailProperty && (
          <div className="space-y-5 px-6 py-6 sm:p-8">
            {(() => {
              const statusCfg = STATUS_CONFIG[detailProperty.status] || STATUS_CONFIG.vacant
              const owner = ownerById(detailProperty.ownerId)
              return (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </span>
                    <span className="text-xs text-gray-500">{detailProperty.type}</span>
                    {detailProperty.unitLabel && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: colors.primaryVeryLight, color: colors.primary }}
                      >
                        {detailProperty.unitLabel}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Surface</p>
                      <p className="text-gray-900">{detailProperty.surface ? `${detailProperty.surface} m²` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pièces</p>
                      <p className="text-gray-900">{detailProperty.nbRooms || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Loyer mensuel</p>
                      <p className="font-semibold" style={{ color: colors.primary }}>
                        {formatGNF(detailProperty.rentAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Commission</p>
                      <p className="text-gray-900">{detailProperty.commissionRate || 0}%</p>
                    </div>
                  </div>

                  {detailProperty.description && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</p>
                      <p className="text-sm text-gray-700">{detailProperty.description}</p>
                    </div>
                  )}

                  {!ownerId && owner && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Propriétaire
                      </p>
                      <p className="text-sm text-gray-900">{owner.name}</p>
                      <p className="text-sm text-gray-500">{owner.phone}</p>
                    </div>
                  )}

                  {detailProperty.createdAt && (
                    <p className="text-xs text-gray-400">
                      Ajouté le {firebaseDateFormat(detailProperty.createdAt)}
                    </p>
                  )}

                  <div className="border-t border-gray-100 pt-4">
                    {deleteConfirm === detailProperty.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Confirmer la suppression ?</span>
                        <button
                          onClick={() => handleDelete(detailProperty)}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                        >
                          Oui, supprimer
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Non
                        </button>
                      </div>
                    ) : showDeleteLink ? (
                      <button
                        onClick={() => setDeleteConfirm(detailProperty.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500"
                      >
                        <RiDeleteBinLine className="h-3.5 w-3.5" />
                        Supprimer ce bien
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowDeleteLink(true)}
                        className="text-xs font-medium text-gray-300 hover:text-gray-500"
                      >
                        Options avancées
                      </button>
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </SimpleDrawer>
    </>
  )
}
