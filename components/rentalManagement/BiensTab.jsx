import { useEffect, useState } from 'react'
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiHome4Line,
  RiArrowRightSLine,
  RiEyeLine,
  RiEyeOffLine,
  RiMore2Fill,
} from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import { firebaseDateFormat } from '@/utils/date'
import Loader from '@/components/Loader'
import SimpleDrawer from '@/components/SimpleDrawer'
import PropertyDrawerForm from './PropertyDrawerForm'
import {
  getManagedProperties,
  getPropertiesByOwner,
  editManagedProperty,
  deleteManagedProperty,
} from '@/lib/services/managedProperties'
import { getPropertyOwners } from '@/lib/services/propertyOwners'
import { getLeasesByProperty } from '@/lib/services/leases'
import { getPaymentsByProperty } from '@/lib/services/rentPayments'
import { getTicketsByProperty } from '@/lib/services/maintenanceTickets'
import { getExpensesByProperty } from '@/lib/services/propertyExpenses'
import { updateProperty } from '@/lib/services/propertyService'

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
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuOpenId) return
      const target = event.target
      if (
        target instanceof HTMLElement &&
        !target.closest('[data-menu-root]')
      ) {
        setMenuOpenId(null)
        setMenuAnchor(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

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

  const openMenu = (event, propertyId) => {
    event.stopPropagation()
    if (menuOpenId === propertyId) {
      setMenuOpenId(null)
      setMenuAnchor(null)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const left = Math.max(
      16,
      Math.min(rect.right - 224, window.innerWidth - 240 - 16)
    )
    const top = Math.min(rect.bottom + 8, window.innerHeight - 220 - 16)

    setMenuOpenId(propertyId)
    setMenuAnchor({ left, top })
  }

  const handleSaved = (saved) => {
    setProperties((prev) => {
      const exists = prev.some((p) => p.id === saved.id)
      return exists
        ? prev.map((p) => (p.id === saved.id ? saved : p))
        : [saved, ...prev]
    })
  }

  const handleOwnerCreated = (owner) => {
    setOwners((prev) => [owner, ...prev])
  }

  const handleDelete = async (property) => {
    const targetColl = property._collection || 'managed_properties'
    try {
      const [leases, payments, tickets, expenses] = await Promise.all([
        getLeasesByProperty(property.id),
        getPaymentsByProperty(property.id),
        getTicketsByProperty(property.id),
        getExpensesByProperty(property.id),
      ])
      if (
        leases.length > 0 ||
        payments.length > 0 ||
        tickets.length > 0 ||
        expenses.length > 0
      ) {
        notify(
          'Impossible de supprimer : ce bien a un historique (bail, paiement, entretien ou dépense) rattaché',
          'error'
        )
        setDeleteConfirm(null)
        return
      }
      await deleteManagedProperty(property.id, targetColl)
      setProperties((prev) => prev.filter((p) => p.id !== property.id))
      setDeleteConfirm(null)
      setDetailProperty(null)
      notify('Bien supprimé avec succès', 'success')
    } catch (e) {
      notify('Une erreur est survenue lors de la suppression', 'error')
    }
  }

  const handleToggleStatus = async (property) => {
    if (!property) return
    const isInactive = property.status === 'inactive'
    const newStatus = isInactive ? 'vacant' : 'inactive'
    const targetColl = property._collection || 'managed_properties'
    try {
      const updateData = { status: newStatus }
      if (targetColl === 'houses' || targetColl === 'daily_rentals') {
        updateData.active = isInactive
        updateData.isAvailable = isInactive
        updateData.published = isInactive
      }
      if (targetColl === 'lands') {
        updateData.active = isInactive
        updateData.published = isInactive
      }
      if (targetColl === 'managed_properties') {
        await editManagedProperty(property.id, updateData, targetColl)
      } else {
        await updateProperty(property.id, updateData, targetColl)
      }
      setProperties((prev) =>
        prev.map((p) =>
          p.id === property.id
            ? { ...p, status: newStatus, active: isInactive }
            : p
        )
      )
      setDetailProperty((prev) =>
        prev ? { ...prev, status: newStatus, active: isInactive } : null
      )
      notify(
        isInactive ? 'Bien réactivé avec succès' : 'Bien désactivé avec succès',
        'success'
      )
    } catch (e) {
      notify('Erreur lors du changement de statut du bien', 'error')
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Biens gérés</h2>
            <p className="mt-1 text-sm text-gray-500">
              {properties.length} bien{properties.length !== 1 ? 's' : ''}{' '}
              enregistré
              {properties.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un bien..."
              className="rounded-xl border-0 bg-gray-100 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
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
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white">
                  <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-4">Photo</th>
                    <th className="py-2 pr-4">Référence</th>
                    <th className="py-2 pr-4">Adresse</th>
                    {!ownerId && <th className="py-2 pr-4">Propriétaire</th>}
                    <th className="py-2 pr-4">Loyer</th>
                    <th className="py-2 pr-4">Statut</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((property) => {
                    const statusCfg =
                      STATUS_CONFIG[property.status] || STATUS_CONFIG.vacant
                    const owner = ownerById(property.ownerId)
                    const mainImage = property.imageUrl

                    return (
                      <tr
                        key={property.id}
                        onClick={() => openDetail(property)}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td className="py-3 pr-4">
                          {mainImage ? (
                            <img
                              src={mainImage}
                              alt={property.reference || 'Bien'}
                              className="shadow-xs h-12 w-16 rounded-lg border border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                              <RiHome4Line className="h-6 w-6" />
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-semibold text-gray-900">
                          {property.reference}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                {property.address}
                                {property.city ? `, ${property.city}` : ''}
                              </span>
                              {property.unitLabel && (
                                <span
                                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                  style={{
                                    backgroundColor: colors.primaryVeryLight,
                                    color: colors.primary,
                                  }}
                                >
                                  {property.unitLabel}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {typeof property.type === 'string'
                                ? property.type
                                : String(
                                    property.type?.property ||
                                      property.type?.transaction ||
                                      'Bien'
                                  )}
                            </p>
                            <div className="flex flex-wrap gap-3 text-[11px] text-gray-400">
                              {property.surface ? (
                                <span>{property.surface} m²</span>
                              ) : null}
                              {property.nbRooms ? (
                                <span>
                                  {property.nbRooms} pièce
                                  {property.nbRooms > 1 ? 's' : ''}
                                </span>
                              ) : null}
                              {property.reference ? (
                                <span>Réf: {property.reference}</span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        {!ownerId && (
                          <td className="py-3 pr-4 text-gray-700">
                            {owner?.name || '—'}
                            <p className="text-xs text-gray-400">
                              {owner?.phone}
                            </p>
                          </td>
                        )}
                        <td
                          className="py-3 pr-4 font-semibold"
                          style={{ color: colors.primary }}
                        >
                          {formatGNF(property.rentAmount)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: statusCfg.bg,
                              color: statusCfg.color,
                            }}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td
                          className="py-3 pr-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end" data-menu-root>
                            <button
                              type="button"
                              onClick={(event) => openMenu(event, property.id)}
                              className="inline-flex items-center justify-center rounded-full border border-gray-200 p-2 text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                              title="Actions"
                            >
                              <RiMore2Fill className="h-4 w-4" />
                            </button>
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

      {menuOpenId && menuAnchor && (
        <div
          className="fixed z-[100] w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-2xl"
          style={{ left: menuAnchor.left, top: menuAnchor.top }}
          data-menu-root
        >
          <button
            type="button"
            onClick={() => {
              setMenuOpenId(null)
              setMenuAnchor(null)
              openDetail(
                properties.find((property) => property.id === menuOpenId) ||
                  null
              )
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RiEyeLine className="h-4 w-4 text-gray-400" />
            Voir détails et photos
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpenId(null)
              setMenuAnchor(null)
              openEdit(
                properties.find((property) => property.id === menuOpenId)
              )
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RiEditLine className="h-4 w-4 text-gray-400" />
            Modifier l'annonce
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpenId(null)
              setMenuAnchor(null)
              handleToggleStatus(
                properties.find((property) => property.id === menuOpenId)
              )
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RiEyeOffLine className="h-4 w-4 text-gray-400" />
            {properties.find((property) => property.id === menuOpenId)
              ?.status === 'inactive'
              ? "Réactiver l'annonce"
              : 'Désactiver / Masquer'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpenId(null)
              setMenuAnchor(null)
              const selectedProperty = properties.find(
                (property) => property.id === menuOpenId
              )
              openDetail(selectedProperty)
              setDeleteConfirm(selectedProperty?.id)
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <RiDeleteBinLine className="h-4 w-4" />
            Supprimer l'annonce
          </button>
        </div>
      )}

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
        description={
          detailProperty
            ? `${detailProperty.address}${
                detailProperty.city ? `, ${detailProperty.city}` : ''
              }`
            : ''
        }
        footerButtons={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDeleteConfirm(detailProperty?.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <RiDeleteBinLine className="h-3.5 w-3.5" />
              Supprimer l'annonce
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleStatus(detailProperty)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  detailProperty?.status === 'inactive'
                    ? 'border-green-600 bg-green-50 text-green-700 hover:bg-green-100'
                    : 'border-amber-600 bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                {detailProperty?.status === 'inactive'
                  ? "Réactiver l'annonce"
                  : 'Désactiver / Masquer'}
              </button>
              <button
                type="button"
                onClick={() => openEdit(detailProperty)}
                className="shadow-xs inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: colors.primary }}
              >
                <RiEditLine className="h-3.5 w-3.5" />
                Modifier l'annonce
              </button>
            </div>
          </div>
        }
      >
        {detailProperty && (
          <div className="space-y-5 px-6 py-6 sm:p-8">
            {(() => {
              const statusCfg =
                STATUS_CONFIG[detailProperty.status] || STATUS_CONFIG.vacant
              const owner = ownerById(detailProperty.ownerId)
              const mainImage = detailProperty.imageUrl
              const gallery = Array.isArray(detailProperty.images)
                ? detailProperty.images
                : detailProperty.images?.gallery ||
                  (Array.isArray(detailProperty.imageUrls) ? detailProperty.imageUrls : [])

              return (
                <>
                  {mainImage && (
                    <div className="shadow-xs overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                      <img
                        src={mainImage}
                        alt={detailProperty.reference || 'Bien'}
                        className="h-52 w-full object-cover"
                      />
                      {Array.isArray(gallery) && gallery.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto border-t border-gray-100 bg-gray-50 p-2">
                          {gallery.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Galerie ${idx + 1}`}
                              className="h-14 w-20 flex-shrink-0 rounded-md border border-gray-200 object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: statusCfg.bg,
                        color: statusCfg.color,
                      }}
                    >
                      {statusCfg.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {typeof detailProperty.type === 'string'
                        ? detailProperty.type
                        : String(
                            detailProperty.type?.property ||
                              detailProperty.type?.transaction ||
                              'Bien'
                          )}
                    </span>
                    {detailProperty.unitLabel && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: colors.primaryVeryLight,
                          color: colors.primary,
                        }}
                      >
                        {detailProperty.unitLabel}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Surface
                      </p>
                      <p className="text-gray-900">
                        {detailProperty.surface
                          ? `${detailProperty.surface} m²`
                          : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Pièces
                      </p>
                      <p className="text-gray-900">
                        {detailProperty.nbRooms || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Loyer mensuel
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: colors.primary }}
                      >
                        {formatGNF(detailProperty.rentAmount)}
                      </p>
                    </div>
                  </div>

                  {detailProperty.description && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Description
                      </p>
                      <p className="text-sm text-gray-700">
                        {detailProperty.description}
                      </p>
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
                        <span className="text-xs text-gray-500">
                          Confirmer la suppression ?
                        </span>
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
