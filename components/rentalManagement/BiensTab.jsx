import { useEffect, useState } from 'react'
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiHome4Line } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import { formatGNF } from '@/utils/format'
import Loader from '@/components/Loader'
import PropertyDrawerForm from './PropertyDrawerForm'
import { getManagedProperties, getPropertiesByOwner, deleteManagedProperty } from '@/lib/services/managedProperties'
import { getPropertyOwners } from '@/lib/services/propertyOwners'

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
    setSelected(property)
    setDrawerOpen(true)
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
      await deleteManagedProperty(property.id)
      setProperties((prev) => prev.filter((p) => p.id !== property.id))
      setDeleteConfirm(null)
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
                    <tr key={property.id}>
                      <td className="py-3 pr-4 font-semibold text-gray-900">{property.reference}</td>
                      <td className="py-3 pr-4 text-gray-700">
                        {property.address}
                        {property.city ? `, ${property.city}` : ''}
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
                      <td className="py-3 pr-4">
                        {deleteConfirm === property.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Confirmer ?</span>
                            <button
                              onClick={() => handleDelete(property)}
                              className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
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
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(property)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
                              title="Modifier"
                            >
                              <RiEditLine className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(property.id)}
                              className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-500"
                              title="Supprimer"
                            >
                              <RiDeleteBinLine className="h-4 w-4" />
                            </button>
                          </div>
                        )}
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
    </>
  )
}
