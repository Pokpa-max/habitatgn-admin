import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RiCheckLine, RiCloseLine, RiImageAddLine } from 'react-icons/ri'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'
import Loader from '@/components/Loader'
import DrawerForm from '@/components/DrawerForm'
import { uploadToCloudinary } from '@/utils/cloudinary'
import { editManagedProperty } from '@/lib/services/managedProperties'
import { addPropertyOwner } from '@/lib/services/propertyOwners'
import { addProperty, updateProperty } from '@/lib/services/propertyService'
import { REGIONS, currencyOptions } from '../../_data'

const resolveExistingImages = (selectedItem) => {
  if (!selectedItem) return []
  const imgs = selectedItem.images
  const fromImages = Array.isArray(imgs)
    ? imgs
    : [imgs?.cover, ...(Array.isArray(imgs?.gallery) ? imgs.gallery : [])]
  const legacyUrls = Array.isArray(selectedItem.imageUrls) ? selectedItem.imageUrls : []
  const houseInsides = Array.isArray(selectedItem.houseInsides) ? selectedItem.houseInsides : []
  return Array.from(
    new Set(
      [selectedItem.imageUrl, ...fromImages, ...legacyUrls, ...houseInsides].filter(Boolean)
    )
  )
}

const PROPERTY_TYPES = ['Appartement', 'Maison', 'Studio', 'Commerce', 'Terrain']

const CATEGORY_OPTIONS = [
  { value: 'houses', label: 'Bien classique (maison, appartement, terrain...)' },
  { value: 'daily_rentals', label: 'Location journalière' },
]
const KNOWN_COLLECTIONS = ['houses', 'lands', 'daily_rentals', 'managed_properties']
const SINGULAR_CATEGORY_MAP = { house: 'houses', land: 'lands', daily_rental: 'daily_rentals' }
const PLURAL_TO_SINGULAR_CATEGORY = { houses: 'house', lands: 'land', daily_rentals: 'daily_rental' }

const TRANSACTION_OPTIONS = {
  houses: [
    { value: 'rent', label: 'Location' },
    { value: 'sale', label: 'Vente' },
    { value: 'bail', label: 'Bail' },
  ],
  lands: [
    { value: 'rent', label: 'Location' },
    { value: 'sale', label: 'Vente' },
  ],
}

const PROPERTY_TYPE_OPTIONS = [
  { value: 'apartment', label: 'Appartement' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'house', label: 'Maison' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'commercial', label: 'Local commercial' },
  { value: 'land', label: 'Terrain' },
]

const CONDITION_OPTIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'good', label: 'Bon état' },
  { value: 'average', label: 'État moyen' },
  { value: 'renovation', label: 'À rénover' },
]

const PERIOD_OPTIONS = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
]

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
  const [imageFiles, setImageFiles] = useState([])
  const [existingImageUrls, setExistingImageUrls] = useState([])

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
    if (typeof selectedItem?.address === 'string' && selectedItem.address.trim()) {
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
      return selectedItem.location.region || selectedItem.location.municipality || ''
    }
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
    if (typeof selectedItem?.rentAmount === 'number' || typeof selectedItem?.rentAmount === 'string') {
      const numeric = Number(selectedItem.rentAmount)
      if (!Number.isNaN(numeric)) return numeric
    }
    if (typeof selectedItem?.price === 'object' && selectedItem.price !== null) {
      const numeric = Number(selectedItem.price.amount)
      if (!Number.isNaN(numeric)) return numeric
    }
    return ''
  }

  const resolveSurfaceValue = (selectedItem) => {
    const fromFeatures = Number(selectedItem?.features?.area)
    if (!Number.isNaN(fromFeatures) && fromFeatures > 0) return fromFeatures
    const direct = Number(selectedItem?.surface)
    if (!Number.isNaN(direct) && direct > 0) return direct
    return ''
  }

  const hourToTime = (hour, fallback) => {
    if (hour === undefined || hour === null || Number.isNaN(Number(hour))) return fallback
    return `${String(hour).padStart(2, '0')}:00`
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ mode: 'onBlur' })

  useEffect(() => {
    if (!open) return
    setCreatingOwner(false)
    setImageFiles([])
    setExistingImageUrls(resolveExistingImages(selected))

    const targetCollection = selected ? resolveTargetCollection(selected) : null
    const isManaged = targetCollection === 'managed_properties'

    if (selected && isManaged) {
      reset({
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
      })
      setValue('type', resolveTypeValue(selected.type), { shouldDirty: true, shouldTouch: true })
    } else if (selected) {
      const owner = owners?.find((o) => o.id === selected.ownerId)
      reset({
        transactionType: selected.type?.transaction || 'rent',
        propertyType: selected.type?.property || 'apartment',
        region: selected.location?.region || '',
        municipality: selected.location?.municipality || selected.city || '',
        neighborhood: selected.location?.neighborhood || '',
        landmark: selected.location?.landmark || '',
        unitLabel: selected.unitLabel || '',
        description: selected.description || '',
        surface: resolveSurfaceValue(selected),
        bedrooms: selected.features?.bedrooms || '',
        bathrooms: selected.features?.bathrooms || '',
        floor: selected.features?.floor || '',
        furnished: selected.features?.furnished ?? true,
        condition: selected.features?.condition || 'good',
        ownerId: selected.ownerId || lockedOwnerId || owners?.[0]?.id || '',
        commissionRate: selected.commissionRate,
        priceAmount: selected.price?.amount ?? resolveRentValue(selected),
        currency: selected.price?.currency || 'GNF',
        period: selected.price?.period === 'yearly' ? 'yearly' : 'monthly',
        deposit: selected.price?.deposit ?? '',
        negotiable: selected.price?.negotiable ?? false,
        minStay: selected.minStay ?? '',
        maxStay: selected.maxStay ?? '',
        checkInTime: hourToTime(selected.checkInHour, '14:00'),
        checkOutTime: hourToTime(selected.checkOutHour, '11:00'),
        contactName: selected.contact?.name || owner?.name || '',
        contactPhone: selected.contact?.phone || owner?.phone || '',
        contactWhatsapp: selected.contact?.whatsapp || '',
        agencyName: selected.contact?.agencyName || '',
        publishNow: (selected.status || 'available') === 'available',
      })
    } else {
      const owner = owners?.find((o) => o.id === (lockedOwnerId || owners?.[0]?.id))
      reset({
        category: 'houses',
        transactionType: 'rent',
        propertyType: 'apartment',
        region: '',
        municipality: '',
        neighborhood: '',
        landmark: '',
        unitLabel: '',
        unitCount: '1',
        description: '',
        surface: '',
        bedrooms: '',
        bathrooms: '',
        floor: '',
        furnished: true,
        condition: 'good',
        ownerId: lockedOwnerId || owners?.[0]?.id || '',
        commissionRate: '10',
        priceAmount: '',
        currency: 'GNF',
        period: 'monthly',
        deposit: '',
        negotiable: false,
        minStay: '',
        maxStay: '',
        checkInTime: '14:00',
        checkOutTime: '11:00',
        contactName: owner?.name || '',
        contactPhone: owner?.phone || '',
        contactWhatsapp: '',
        agencyName: '',
        publishNow: true,
        newOwnerName: '',
        newOwnerPhone: '',
        newOwnerEmail: '',
      })
    }
  }, [open, selected, lockedOwnerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const watchedCategory = watch('category')
  const watchedPropertyType = watch('propertyType')
  const targetCollection = selected
    ? resolveTargetCollection(selected)
    : watchedCategory === 'daily_rentals'
      ? 'daily_rentals'
      : watchedPropertyType === 'land'
        ? 'lands'
        : 'houses'
  const isManagedProperty = targetCollection === 'managed_properties'
  const isLand = targetCollection === 'lands'
  const isDaily = targetCollection === 'daily_rentals'
  const propertyTypeOptions = selected
    ? PROPERTY_TYPE_OPTIONS.filter((o) => (isLand ? o.value === 'land' : o.value !== 'land'))
    : isDaily
      ? PROPERTY_TYPE_OPTIONS.filter((o) => o.value !== 'land')
      : PROPERTY_TYPE_OPTIONS

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length) {
      setImageFiles((prev) => [...prev, ...files])
    }
    e.target.value = ''
  }

  const removeNewImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const removeExistingImage = (index) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

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

      const uploadedUrls = await Promise.all(
        imageFiles.map((file) => uploadToCloudinary(file))
      )
      const allImageUrls = [...existingImageUrls, ...uploadedUrls]
      const imageFields = {
        imageUrl: allImageUrls[0] || '',
        images: { cover: allImageUrls[0] || '', gallery: allImageUrls },
      }

      if (isManagedProperty) {
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
          verified: selected ? selected.verified : false,
          ...imageFields,
        }

        if (selected) {
          const updated = { ...payload, unitLabel: data.unitLabel || '' }
          await editManagedProperty(selected.id, updated, 'managed_properties')
          onSaved({ ...selected, ...updated })
          notify('Bien modifié avec succès', 'success')
        } else {
          const saved = await addProperty({ ...payload, unitLabel: data.unitLabel || '' })
          onSaved(saved)
          notify('Bien ajouté avec succès', 'success')
        }
        setOpen(false)
        setSaving(false)
        return
      }

      const transaction = isDaily ? 'daily_rent' : data.transactionType
      const period = isDaily ? 'nightly' : transaction === 'sale' ? 'total' : data.period

      const features = isLand
        ? { area: Number(data.surface) || 0 }
        : {
            area: Number(data.surface) || 0,
            bedrooms: Number(data.bedrooms) || 0,
            bathrooms: Number(data.bathrooms) || 0,
            ...(data.floor ? { floor: Number(data.floor) } : {}),
            furnished: isDaily ? true : !!data.furnished,
            condition: data.condition || 'good',
          }

      const municipality = data.municipality || data.region
      const title = [
        PROPERTY_TYPE_OPTIONS.find((o) => o.value === data.propertyType)?.label || 'Logement',
        data.neighborhood || municipality || data.region,
      ]
        .filter(Boolean)
        .join(' - ')

      const payload = {
        title,
        category: PLURAL_TO_SINGULAR_CATEGORY[targetCollection] || 'house',
        type: { transaction, property: data.propertyType },
        location: {
          region: data.region,
          municipality,
          ...(data.neighborhood ? { neighborhood: data.neighborhood } : {}),
          ...(data.landmark ? { landmark: data.landmark } : {}),
        },
        features,
        price: {
          amount: Number(data.priceAmount) || 0,
          currency: data.currency || 'GNF',
          period,
          ...(data.deposit ? { deposit: Number(data.deposit) } : {}),
          negotiable: !!data.negotiable,
        },
        ...(isDaily && data.minStay ? { minStay: Number(data.minStay) } : {}),
        ...(isDaily && data.maxStay ? { maxStay: Number(data.maxStay) } : {}),
        ...(isDaily && data.checkInTime
          ? { checkInHour: Number(data.checkInTime.split(':')[0]) }
          : {}),
        ...(isDaily && data.checkOutTime
          ? { checkOutHour: Number(data.checkOutTime.split(':')[0]) }
          : {}),
        contact: {
          agencyName: data.agencyName || '',
          name: data.contactName || '',
          phone: data.contactPhone || '',
          whatsapp: data.contactWhatsapp || data.contactPhone || '',
        },
        description: data.description || '',
        ownerId,
        commissionRate: Number(data.commissionRate) || 0,
        status: data.publishNow !== false ? 'available' : 'draft',
        published: true,
        verified: selected ? selected.verified : false,
        isAvailable: true,
        ...imageFields,
      }

      if (selected) {
        const updated = { ...payload, unitLabel: data.unitLabel || '' }
        const saved = await updateProperty(selected.id, updated, targetCollection)
        onSaved({ ...selected, ...updated, ...saved })
        notify('Bien modifié avec succès', 'success')
      } else {
        const unitCount = Math.max(1, Number(data.unitCount) || 1)
        const base = String(Date.now()).slice(-6)

        if (unitCount > 1) {
          for (let i = 1; i <= unitCount; i += 1) {
            const reference = `BIEN-${base}-${String(i).padStart(2, '0')}`
            const saved = await addProperty(
              { ...payload, unitLabel: `Appt ${i}`, reference },
              ownerId
            )
            onSaved(saved)
          }
          notify(`${unitCount} appartements créés avec succès`, 'success')
        } else {
          const reference = `BIEN-${base}`
          const saved = await addProperty(
            { ...payload, unitLabel: data.unitLabel || '', reference },
            ownerId
          )
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

  const inputClass =
    'w-full rounded-2xl border-0 bg-gray-100 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary'
  const labelClass = 'mb-2 block text-sm font-semibold text-gray-900'

  return (
    <DrawerForm
      open={open}
      setOpen={setOpen}
      onSubmit={handleSubmit(onSubmit)}
      title={selected ? 'Modifier le bien' : 'Ajouter un bien'}
      description={
        selected ? 'Mettez à jour les informations du bien' : 'Enregistrer un nouveau bien'
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
            <label className={labelClass}>Catégorie</label>
            <select
              {...register('category', {
                onChange: (e) => {
                  if (e.target.value === 'daily_rentals' && watch('propertyType') === 'land') {
                    setValue('propertyType', 'apartment')
                  }
                },
              })}
              className={inputClass}
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

        {isManagedProperty ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type de bien</label>
                <select {...register('type')} className={inputClass}>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Statut</label>
                <select {...register('status')} className={inputClass}>
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupé</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Adresse *</label>
              <input
                type="text"
                {...register('address', { required: 'Requis' })}
                className={inputClass}
                placeholder="Ex: Kaloum, rue KA-025"
              />
              {errors.address && (
                <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Ville</label>
                <input type="text" {...register('city')} className={inputClass} placeholder="Conakry" />
              </div>
              <div>
                <label className={labelClass}>Surface (m²)</label>
                <input type="number" {...register('surface')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Pièces</label>
                <input type="number" {...register('nbRooms')} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
              <div>
                <label className={labelClass}>Loyer mensuel (GNF) *</label>
                <input
                  type="number"
                  {...register('rentAmount', { required: 'Requis' })}
                  className={inputClass}
                  placeholder="Ex: 1500000"
                />
                {errors.rentAmount && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.rentAmount.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Commission agence (%)</label>
                <input type="number" {...register('commissionRate')} className={inputClass} placeholder="Ex: 10" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {!isDaily && (
                <div>
                  <label className={labelClass}>Transaction</label>
                  <select {...register('transactionType')} className={inputClass}>
                    {(TRANSACTION_OPTIONS[targetCollection] || TRANSACTION_OPTIONS.houses).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>Type de bien</label>
                <select {...register('propertyType')} className={inputClass}>
                  {propertyTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Commune *</label>
                <select
                  {...register('municipality', {
                    required: 'Requis',
                    onChange: (e) => {
                      const region =
                        REGIONS.find((r) => r.communes.some((c) => c.label === e.target.value))
                          ?.name || ''
                      setValue('region', region, { shouldValidate: true })
                    },
                  })}
                  className={inputClass}
                >
                  <option value="">Sélectionner une commune</option>
                  {REGIONS.map((r) => (
                    <optgroup key={r.name} label={r.name}>
                      {r.communes.map((c) => (
                        <option key={c.value} value={c.label}>
                          {c.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.municipality && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>
                    {errors.municipality.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Région</label>
                <input
                  type="text"
                  readOnly
                  {...register('region', { required: 'Requis' })}
                  className={`${inputClass} cursor-not-allowed text-gray-500`}
                  placeholder="Déterminée selon la commune"
                />
                {errors.region && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.region.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Quartier</label>
                <input type="text" {...register('neighborhood')} className={inputClass} placeholder="Ex: Kipé" />
              </div>
              <div>
                <label className={labelClass}>Repère (optionnel)</label>
                <input type="text" {...register('landmark')} className={inputClass} placeholder="Ex: près du marché" />
              </div>
            </div>

            {selected ? (
              <div>
                <label className={labelClass}>Étiquette de l'unité</label>
                <input type="text" {...register('unitLabel')} className={inputClass} placeholder="Ex: Appt 3" />
              </div>
            ) : (
              <div>
                <label className={labelClass}>Nombre d'appartements identiques à créer</label>
                <input
                  type="number"
                  min="1"
                  {...register('unitCount')}
                  className={`max-w-32 ${inputClass}`}
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Pour un immeuble de plusieurs appartements, indiquez le nombre à créer d'un coup
                  (ex: 20). Chacun sera étiqueté "Appt 1", "Appt 2"... et modifiable individuellement
                  ensuite.
                </p>
              </div>
            )}

            <div className={`grid gap-4 ${isLand ? 'grid-cols-1' : 'grid-cols-3'}`}>
              <div>
                <label className={labelClass}>Surface (m²)</label>
                <input type="number" {...register('surface')} className={inputClass} />
              </div>
              {!isLand && (
                <>
                  <div>
                    <label className={labelClass}>Chambres</label>
                    <input type="number" {...register('bedrooms')} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Salles de bain</label>
                    <input type="number" {...register('bathrooms')} className={inputClass} />
                  </div>
                </>
              )}
            </div>

            {!isLand && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Étage</label>
                  <input type="number" {...register('floor')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>État</label>
                  <select {...register('condition')} className={inputClass}>
                    {CONDITION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                {!isDaily && (
                  <div className="flex items-end pb-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <input type="checkbox" {...register('furnished')} className="h-4 w-4" />
                      Meublé
                    </label>
                  </div>
                )}
              </div>
            )}

            {isDaily && (
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                <div>
                  <label className={labelClass}>Séjour min (nuits)</label>
                  <input type="number" min="1" {...register('minStay')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Séjour max (nuits)</label>
                  <input type="number" min="1" {...register('maxStay')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Heure d'arrivée</label>
                  <input type="time" {...register('checkInTime')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Heure de départ</label>
                  <input type="time" {...register('checkOutTime')} className={inputClass} />
                </div>
              </div>
            )}

            <div>
              <label className={labelClass}>Description</label>
              <textarea rows={2} {...register('description')} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Photos</label>
              <div className="flex flex-wrap items-center gap-3">
                {existingImageUrls.map((url, i) => (
                  <div key={`existing-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                    <img src={url} alt="Aperçu" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <RiCloseLine className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {imageFiles.map((file, i) => (
                  <div key={`new-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                    <img src={URL.createObjectURL(file)} alt="Aperçu" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                    >
                      <RiCloseLine className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100">
                  <RiImageAddLine className="h-6 w-6 text-gray-400" />
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            {!lockedOwnerId && (
              <div className="border-t border-gray-100 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Propriétaire</p>
                  <button
                    type="button"
                    onClick={() => setCreatingOwner((v) => !v)}
                    className="text-xs font-semibold"
                    style={{ color: colors.primary }}
                  >
                    {creatingOwner ? 'Choisir un propriétaire existant' : '+ Nouveau propriétaire'}
                  </button>
                </div>

                {creatingOwner ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nom *</label>
                      <input
                        type="text"
                        {...register('newOwnerName', { required: creatingOwner ? 'Requis' : false })}
                        className={inputClass}
                      />
                      {errors.newOwnerName && (
                        <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.newOwnerName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Téléphone *</label>
                      <input
                        type="text"
                        {...register('newOwnerPhone', { required: creatingOwner ? 'Requis' : false })}
                        className={inputClass}
                        placeholder="+224 6XX XX XX XX"
                      />
                      {errors.newOwnerPhone && (
                        <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.newOwnerPhone.message}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Email</label>
                      <input type="email" {...register('newOwnerEmail')} className={inputClass} />
                    </div>
                  </div>
                ) : (
                  <select
                    {...register('ownerId', { required: !creatingOwner ? 'Requis' : false })}
                    className={inputClass}
                  >
                    {owners?.length === 0 && <option value="">Aucun propriétaire — créez-en un</option>}
                    {owners?.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} — {o.phone}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="border-t border-gray-100 pt-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Contact affiché sur l'annonce
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nom de l'agence (optionnel)</label>
                  <input type="text" {...register('agencyName')} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Nom du contact *</label>
                  <input
                    type="text"
                    {...register('contactName', { required: 'Requis' })}
                    className={inputClass}
                  />
                  {errors.contactName && (
                    <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.contactName.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Téléphone *</label>
                  <input
                    type="text"
                    {...register('contactPhone', { required: 'Requis' })}
                    className={inputClass}
                    placeholder="+224 6XX XX XX XX"
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.contactPhone.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>WhatsApp (optionnel)</label>
                  <input type="text" {...register('contactWhatsapp')} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
              <div>
                <label className={labelClass}>Prix *</label>
                <input
                  type="number"
                  {...register('priceAmount', { required: 'Requis' })}
                  className={inputClass}
                  placeholder="Ex: 1500000"
                />
                {errors.priceAmount && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: colors.error }}>{errors.priceAmount.message}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>Devise</label>
                <select {...register('currency')} className={inputClass}>
                  {currencyOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              {!isDaily && watch('transactionType') !== 'sale' && (
                <div>
                  <label className={labelClass}>Période</label>
                  <select {...register('period')} className={inputClass}>
                    {PERIOD_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className={labelClass}>Caution (optionnel)</label>
                <input type="number" {...register('deposit')} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Commission agence (%)</label>
                <input type="number" {...register('commissionRate')} className={inputClass} placeholder="Ex: 10" />
              </div>
              <div className="flex items-end pb-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <input type="checkbox" {...register('negotiable')} className="h-4 w-4" />
                  Prix négociable
                </label>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <input type="checkbox" {...register('publishNow')} className="h-4 w-4" />
                Publier immédiatement sur le site public
              </label>
              <p className="mt-1 text-xs text-gray-400">
                Décoché, le bien est enregistré en brouillon et n'apparaît pas dans les recherches.
              </p>
            </div>
          </>
        )}
      </div>
    </DrawerForm>
  )
}
