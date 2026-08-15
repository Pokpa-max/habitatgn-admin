import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiCheckLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import DrawerForm from '@/components/DrawerForm'
import { editManagedProperty } from '@/lib/services/managedProperties'
import { addPropertyOwner } from '@/lib/services/propertyOwners'
import { addProperty, updateProperty } from '@/lib/services/propertyService'

const PROPERTY_TYPES = ['Appartement', 'Maison', 'Studio', 'Commerce', 'Terrain']

// Catégories du site public (chacune = une collection Firestore distincte).
// Un bien existant porte déjà sa vraie collection dans `_collection` (calculée par
// getPropertiesByOwner) ; ce n'est qu'à la création qu'on doit demander le choix à l'admin.
const CATEGORY_OPTIONS = [
  { value: 'houses', label: 'Maison / Appartement (location ou vente)' },
  { value: 'lands', label: 'Terrain' },
  { value: 'daily_rentals', label: 'Location journalière' },
]
const KNOWN_COLLECTIONS = ['houses', 'lands', 'daily_rentals', 'managed_properties']
// Les documents publiés depuis le site public stockent un `category` au singulier
// (house/land/daily_rental) alors que les collections Firestore sont au pluriel.
const SINGULAR_CATEGORY_MAP = { house: 'houses', land: 'lands', daily_rental: 'daily_rentals' }

// Formulaire de création/édition d'un bien, partagé entre BiensTab (choix libre du
// propriétaire) et la page détail propriétaire (propriétaire imposé par lockedOwnerId).
export default function PropertyDrawerForm({
  open,
  setOpen,
  selected,
  owners,
  lockedOwnerId,
  onSaved,
  onOwnerCreated,
}) {
  const colors = useColors()
  const [saving, setSaving] = useState(false)
  const [creatingOwner, setCreatingOwner] = useState(false)

  // Détermine la VRAIE collection Firestore d'un bien existant, pour éditer le bon
  // document (managed_properties / houses / lands / daily_rentals) au lieu de le
  // dupliquer ou d'échouer silencieusement sur un id inexistant dans la mauvaise collection.
  const resolveTargetCollection = (selectedItem) => {
    if (KNOWN_COLLECTIONS.includes(selectedItem?._collection)) {
      return selectedItem._collection
    }
    const rawCategory =
      selectedItem?.category || selectedItem?.propertyCategory || ''
    const normalized = String(rawCategory).trim().toLowerCase()
    if (KNOWN_COLLECTIONS.includes(normalized)) return normalized
    return SINGULAR_CATEGORY_MAP[normalized] || 'houses'
  }

  const resolveTypeValue = (value) => {
    if (!value) return 'Appartement'
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized.includes('maison') || normalized.includes('house'))
        return 'Maison'
      if (normalized.includes('studio')) return 'Studio'
      if (
        normalized.includes('commerce') ||
        normalized.includes('boutique') ||
        normalized.includes('commercial')
      )
        return 'Commerce'
      if (
        normalized.includes('appartement') ||
        normalized.includes('appart') ||
        normalized.includes('apartment')
      )
        return 'Appartement'
      return value
    }

    if (typeof value === 'object') {
      const candidate = value.property || value.transaction || value.type || ''
      return resolveTypeValue(candidate)
    }

    return 'Appartement'
  }

  const resolveAddressValue = (selectedItem) => {
    if (
      typeof selectedItem?.address === 'string' &&
      selectedItem.address.trim()
    ) {
      return selectedItem.address
    }
    if (selectedItem?.location && typeof selectedItem.location === 'object') {
      const parts = [
        selectedItem.location.neighborhood,
        selectedItem.location.municipality,
        selectedItem.location.landmark,
      ].filter(Boolean)
      return parts.join(', ')
    }
    return ''
  }

  const resolveCityValue = (selectedItem) => {
    if (typeof selectedItem?.city === 'string' && selectedItem.city.trim()) {
      return selectedItem.city
    }
    if (selectedItem?.location && typeof selectedItem.location === 'object') {
      return (
        selectedItem.location.region || selectedItem.location.municipality || ''
      )
    }
    return ''
  }

  const resolveSurfaceValue = (selectedItem) => {
    const direct = Number(selectedItem?.surface)
    if (!Number.isNaN(direct) && direct > 0) return direct
    const fromFeatures = Number(selectedItem?.features?.area)
    if (!Number.isNaN(fromFeatures) && fromFeatures > 0) return fromFeatures
    return ''
  }

  const resolveRoomValue = (selectedItem) => {
    const direct = Number(selectedItem?.nbRooms)
    if (!Number.isNaN(direct) && direct > 0) return direct
    const fromFeatures = Number(selectedItem?.features?.bedrooms)
    if (!Number.isNaN(fromFeatures) && fromFeatures > 0) return fromFeatures
    return ''
  }

  const resolveRentValue = (selectedItem) => {
    if (
      typeof selectedItem?.rentAmount === 'number' ||
      typeof selectedItem?.rentAmount === 'string'
    ) {
      const numeric = Number(selectedItem.rentAmount)
      if (!Number.isNaN(numeric)) return numeric
    }
    if (
      typeof selectedItem?.price === 'object' &&
      selectedItem.price !== null
    ) {
      const numeric = Number(selectedItem.price.amount)
      if (!Number.isNaN(numeric)) return numeric
    }
    return ''
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  useEffect(() => {
    if (!open) return
    setCreatingOwner(false)
    if (selected) {
      const formValues = {
        type: resolveTypeValue(selected.type),
        address: resolveAddressValue(selected),
        city: resolveCityValue(selected),
        unitLabel: selected.unitLabel || '',
        description: selected.description || '',
        surface: resolveSurfaceValue(selected),
        nbRooms: resolveRoomValue(selected),
        ownerId: selected.ownerId || lockedOwnerId || owners?.[0]?.id || '',
        commissionRate: selected.commissionRate,
        rentAmount: resolveRentValue(selected),
        status: selected.status,
      }
      reset(formValues)
      setValue('type', formValues.type, {
        shouldDirty: true,
        shouldTouch: true,
      })
    } else {
      reset({
        type: 'Appartement',
        category: 'houses',
        address: '',
        city: '',
        unitLabel: '',
        unitCount: '1',
        description: '',
        surface: '',
        nbRooms: '',
        ownerId: lockedOwnerId || owners?.[0]?.id || '',
        commissionRate: '10',
        rentAmount: '',
        status: 'vacant',
        newOwnerName: '',
        newOwnerPhone: '',
        newOwnerEmail: '',
      })
    }
  }, [open, selected, lockedOwnerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      let ownerId = lockedOwnerId || data.ownerId

      if (!lockedOwnerId && creatingOwner) {
        const newOwner = await addPropertyOwner({
          name: data.newOwnerName,
          phone: data.newOwnerPhone,
          email: data.newOwnerEmail || '',
        })
        ownerId = newOwner.id
        onOwnerCreated?.(newOwner)
      }

      const payload = {
        title: data.title || data.address,
        type: data.type,
        address: data.address,
        city: data.city,
        description: data.description,
        surface: Number(data.surface) || 0,
        nbRooms: Number(data.nbRooms) || 0,
        ownerId,
        commissionRate: Number(data.commissionRate) || 0,
        rentAmount: Number(data.rentAmount) || 0,
        status: data.status,
        active: data.status !== 'inactive',
        published: true,
        verified: false,
      }

      if (selected) {
        const updated = { ...payload, unitLabel: data.unitLabel || '' }
        const targetCollection = resolveTargetCollection(selected)
        if (targetCollection === 'managed_properties') {
          await editManagedProperty(selected.id, updated, 'managed_properties')
          onSaved({ ...selected, ...updated })
        } else {
          updated.category = targetCollection
          const saved = await updateProperty(selected.id, updated, targetCollection)
          onSaved({ ...selected, ...updated, ...saved })
        }
        notify('Bien modifié avec succès', 'success')
      } else {
        const unitCount = Math.max(1, Number(data.unitCount) || 1)
        const base = String(Date.now()).slice(-6)
        payload.category = data.category || 'houses'

        if (unitCount > 1) {
          for (let i = 1; i <= unitCount; i += 1) {
            const reference = `BIEN-${base}-${String(i).padStart(2, '0')}`
            const saved = await addProperty({
              ...payload,
              unitLabel: `Appt ${i}`,
              reference,
            })
            onSaved(saved)
          }
          notify(`${unitCount} appartements créés avec succès`, 'success')
        } else {
          const reference = `BIEN-${base}`
          const saved = await addProperty({
            ...payload,
            unitLabel: data.unitLabel || '',
            reference,
          })
          onSaved(saved)
          notify('Bien ajouté avec succès', 'success')
        }
      }
      setOpen(false)
    } catch (e) {
      notify('Une erreur est survenue', 'error')
    }
    setSaving(false)
  }

  return (
    <DrawerForm
      open={open}
      setOpen={setOpen}
      onSubmit={handleSubmit(onSubmit)}
      title={selected ? 'Modifier le bien' : 'Ajouter un bien'}
      description={
        selected
          ? 'Mettez à jour les informations du bien'
          : 'Enregistrer un nouveau bien géré'
      }
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
                onClick={() => setOpen(false)}
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
        {!selected && (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Catégorie
            </label>
            <select
              {...register('category')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Détermine où le bien sera publié sur le site public. Ce choix ne pourra plus être
              changé après la création.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Type de bien
            </label>
            <select
              {...register('type')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Statut
            </label>
            <select
              {...register('status')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupé</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Adresse *
          </label>
          <input
            type="text"
            {...register('address', { required: 'Requis' })}
            className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ex: Kaloum, rue KA-025"
          />
          {errors.address && (
            <p className="mt-1 text-xs font-semibold text-red-500">
              {errors.address.message}
            </p>
          )}
        </div>

        {selected ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Étiquette de l'unité
            </label>
            <input
              type="text"
              {...register('unitLabel')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: Appt 3"
            />
            <p className="mt-1 text-xs text-gray-400">
              Utile si ce bien fait partie d'un immeuble à plusieurs
              appartements.
            </p>
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Nombre d'appartements identiques à créer
            </label>
            <input
              type="number"
              min="1"
              {...register('unitCount')}
              className="max-w-32 w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="1"
            />
            <p className="mt-1 text-xs text-gray-400">
              Pour un immeuble de plusieurs appartements, indiquez le nombre à
              créer d'un coup (ex: 20). Chacun sera étiqueté "Appt 1", "Appt
              2"... et modifiable individuellement ensuite (loyer, statut,
              locataire).
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Ville
            </label>
            <input
              type="text"
              {...register('city')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Conakry"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Surface (m²)
            </label>
            <input
              type="number"
              {...register('surface')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Pièces
            </label>
            <input
              type="number"
              {...register('nbRooms')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-900">
            Description
          </label>
          <textarea
            rows={2}
            {...register('description')}
            className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {!lockedOwnerId && (
          <div className="border-t border-gray-100 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Propriétaire
              </p>
              <button
                type="button"
                onClick={() => setCreatingOwner((v) => !v)}
                className="text-xs font-semibold"
                style={{ color: colors.primary }}
              >
                {creatingOwner
                  ? 'Choisir un propriétaire existant'
                  : '+ Nouveau propriétaire'}
              </button>
            </div>

            {creatingOwner ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Nom *
                  </label>
                  <input
                    type="text"
                    {...register('newOwnerName', {
                      required: creatingOwner ? 'Requis' : false,
                    })}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.newOwnerName && (
                    <p className="mt-1 text-xs font-semibold text-red-500">
                      {errors.newOwnerName.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Téléphone *
                  </label>
                  <input
                    type="text"
                    {...register('newOwnerPhone', {
                      required: creatingOwner ? 'Requis' : false,
                    })}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="+224 6XX XX XX XX"
                  />
                  {errors.newOwnerPhone && (
                    <p className="mt-1 text-xs font-semibold text-red-500">
                      {errors.newOwnerPhone.message}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-900">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register('newOwnerEmail')}
                    className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            ) : (
              <select
                {...register('ownerId', {
                  required: !creatingOwner ? 'Requis' : false,
                })}
                className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {owners?.length === 0 && (
                  <option value="">Aucun propriétaire — créez-en un</option>
                )}
                {owners?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.phone}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Loyer mensuel (GNF) *
            </label>
            <input
              type="number"
              {...register('rentAmount', { required: 'Requis' })}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: 1500000"
            />
            {errors.rentAmount && (
              <p className="mt-1 text-xs font-semibold text-red-500">
                {errors.rentAmount.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              Commission agence (%)
            </label>
            <input
              type="number"
              {...register('commissionRate')}
              className="w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Ex: 10"
            />
          </div>
        </div>
      </div>
    </DrawerForm>
  )
}
