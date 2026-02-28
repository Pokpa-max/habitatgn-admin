import { serverTimestamp } from 'firebase/firestore'

export const landConstructorCreate = ({
  area,
  price,
  currency,
  phoneNumber,
  section,
  imageUrl,
  description,
  long,
  lat,
  images,
  zone,
  offerType,
  isAvailable,
  userId,
  town,
}) => {
  const commune = zone?.label && zone?.value
    ? { label: zone.label, value: zone.value, lat: Number(lat) || 0, long: Number(long) || 0 }
    : zone || null
  const quartier = typeof section === 'string' ? section : (section?.value || section?.label || null)
  const townStr = typeof town === 'string' ? town : (town?.label || town?.value || 'Conakry')

  return {
    userId,
    propertyType: { label: 'Terrain', value: 'land' },
    offerType: offerType?.value ? { label: offerType.label, value: offerType.value } : offerType,
    address: {
      town: townStr,
      commune,
      section: quartier,
      zone: commune ? (commune.value || '') : '',
      lat: Number(lat) || 0,
      long: Number(long) || 0,
    },
    area: Number(area) || 0,
    price: Number(price) || 0,
    currency: currency?.value ? currency.value : (currency || 'GNF'),
    isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
    imageUrl,
    images: images || [],
    phoneNumber,
    description,
    likes: [],
    type: 'land',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

export const autoFillLandForm = (reset, setValue, data) => {
  if (!data) {
    reset()
    return
  }

  const addr = data.address || {}

  setValue('description', data.description)
  setValue('area', data.area)
  setValue('price', data.price)
  setValue('currency', data.currency
    ? { value: data.currency, label: data.currency }
    : { value: 'GNF', label: 'GNF' })

  setValue('offerType', data.offerType?.value
    ? { value: data.offerType.value, label: data.offerType.label }
    : data.offerType)

  const displayPhone = data.phoneNumber
    ? String(data.phoneNumber).replace(/^(?:\+224|00224)/, '')
    : undefined
  setValue('phoneNumber', displayPhone)

  // Address — section est un string libre, town aussi
  const rawSection = addr?.section
  setValue('section', typeof rawSection === 'string'
    ? rawSection
    : (rawSection?.value || rawSection?.label || ''))
  setValue('long', Number(addr?.long) || 0)
  setValue('lat', Number(addr?.lat) || 0)
  setValue('zone', addr?.commune?.value
    ? { value: addr.commune.value, label: addr.commune.label }
    : addr?.zone ? { value: addr.zone, label: addr.zone } : undefined)
  const rawTown = addr?.town
  setValue('town', typeof rawTown === 'string' ? rawTown : (rawTown?.label || rawTown?.value || ''))

  setValue('isAvailable', data.isAvailable)
  setValue('imageUrl', data.imageUrl)
  // Rétrocompat : anciens docs stockent houseInsides, nouveaux stockent images
  setValue('images', data.images || data.houseInsides || [])
}
