// Entity constructor for the data model

import { serverTimestamp, GeoPoint, Timestamp, updateDoc, doc } from 'firebase/firestore'
import { encode } from './geoHash';
import { firebaseDateToJsDate } from '../utils/date'
import { stringToColour } from '../utils/ui'
import { offerType } from '_data';
import { db } from '@/lib/firebase/client_config';
import { deleteStorageImage } from './firebase/storage';

export const houseRef = (houseId) => doc(db, `houses/${houseId}`)


export const houseConstructorUpdateOffline = ({

  phoneNumber,
  section,
  // imageUrl,
  adVance,

  houseType,
  description,
  long,
  lat,
  price,
  partNumber,
  // houseInsides,
  surface,
  zone,
  commodite,
  offerType,
  area,
  furnishing,
  housingDeposit,
  isFurnished,
  isPurchaseMode,
  rentalDeposit,
  rentalStatus,
  reservationDetails,

  isAvailable,

}) => ({
  address: {
    commune: zone && zone.value ? { label: zone.label, value: zone.value, lat: Number(lat) || 0, long: Number(long) || 0 } : (zone || null),
    section: section && section.value ? { label: section.label, value: section.value } : (section || null),
    long: Number(long),
    lat: Number(lat),
  },
  description: description,
  commodite: commodite,
  adVance: Number(adVance) || 0,
  houseType: houseType,
  offerType: offerType,
  phoneNumber: phoneNumber,
  partNumber: partNumber,
  bedrooms: Number(partNumber) || 0,
  area: area || 0,
  furnishing: furnishing && furnishing.value ? { label: furnishing.label, value: furnishing.value } : null,
  housingDeposit: Number(housingDeposit) || 0,
  isFurnished: typeof isFurnished === 'boolean' ? isFurnished : Boolean(furnishing && furnishing.value && !String(furnishing.value).toLowerCase().includes('non')),
  isPurchaseMode: Boolean(isPurchaseMode),
  rentalDeposit: Number(rentalDeposit) || 0,
  rentalStatus: rentalStatus || '',
  reservationDetails: reservationDetails || null,
  price: price,
  surface: surface,
  isAvailable: isAvailable,

})





export const houseConstructorUpdate = ({

  phoneNumber,
  section,
  imageUrl,
  adVance,
  houseType,
  description,
  long,
  lat,
  price,
  partNumber,
  houseInsides,
  surface,
  zone,
  commodite,
  offerType,
  area,
  furnishing,
  housingDeposit,
  isFurnished,
  isPurchaseMode,
  rentalDeposit,
  rentalStatus,
  reservationDetails,
  isAvailable,

}) => ({
  description: description,
  commodites: commodite ? (typeof commodite === 'string' ? [commodite] : commodite.value ? [commodite.value] : [commodite]) : [],
  adVance: Number(adVance) || 0,
  houseType: houseType && houseType.value ? houseType : houseType,
  offerType: offerType && offerType.value ? offerType : offerType,
  phoneNumber: phoneNumber,
  partNumber: partNumber,
  bedrooms: Number(partNumber) || 0,
  area: area || 0,
  furnishing: furnishing && furnishing.value ? { label: furnishing.label, value: furnishing.value } : null,
  housingDeposit: Number(housingDeposit) || 0,
  isFurnished: typeof isFurnished === 'boolean' ? isFurnished : Boolean(furnishing && furnishing.value && !String(furnishing.value).toLowerCase().includes('non')),
  isPurchaseMode: Boolean(isPurchaseMode),
  rentalDeposit: Number(rentalDeposit) || 0,
  rentalStatus: rentalStatus || '',
  reservationDetails: reservationDetails || null,
  price: price,
  surface: surface,
  imageUrl: imageUrl,
  houseInsides: houseInsides,
  isAvailable: isAvailable,
  "address.zone": zone && zone.value ? zone.value : null,
  "address.section": section && section.value ? section.value : section,
  "address.long": Number(long),
  "address.lat": Number(lat),
  updatedAt: serverTimestamp(),
})





export const restaurantConstructorUpdateOffline = ({
  storename: name,
  firstname,
  lastname,
  email,
  phoneNumber,
  position,
  indication: description,
  long,
  lat,
  zone,
  quartier,
  rccm,
  nif,
  otherAcc,
  isActive,
  restaurantEmail,
  restaurantPhoneNumber,
}) => ({
  restaurant: {
    name,
    rccm,
    nif,
    otherAcc,
    email: restaurantEmail,
    phoneNumber: restaurantPhoneNumber,
  },
  manager: {
    firstname,
    lastname,
    phoneNumber,
    position,
    email,
  },
  isActive,
  adress: {
    description,
    zone: zone.value,
    quartier: quartier.value,
    long: Number(long),
    lat: Number(lat),
    position: getGeoPoint(lat, long),
  },
  isAccountCreated: false,
})

export const housesConstructorCreate = ({
  price,
  phoneNumber,
  section,
  imageUrl,
  adVance,
  houseType,
  description,
  long,
  lat,
  partNumber = 0,
  houseInsides,
  surface,
  zone,
  commodite = [],
  commodites,
  offerType,
  isAvailable,
  userId,
  area = 0,
  furnishing,
  town,
  housingDeposit = 0,
  isFurnished = false,
  isPurchaseMode = false,
  rentalDeposit = 0,
  rentalStatus = '',
  reservationDetails = null,
}) => {
  // Normalize select objects (SimpleSelect returns { label, value })
  const commune = zone && zone.label && zone.value ? { label: zone.label, value: zone.value, lat: Number(lat) || 0, long: Number(long) || 0 } : zone || null
  const quartier = section && section.label && section.value ? { label: section.label, value: section.value } : section || null
  const townObj = town && town.label && town.value ? { label: town.label, value: town.value } : { label: 'Conakry', value: 'conakry' }

  // Handle commodities (form sends 'commodites', legacy might send 'commodite')
  const finalCommodities = commodites || commodite || [];
  const processedCommodities = Array.isArray(finalCommodities) ? finalCommodities : finalCommodities ? [finalCommodities] : [];

  return {
    phoneNumber,
    isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
    // Address object matching existing Firestore structure
    address: {
      commune: commune,
      town: townObj,
      // Fix: save section/quartier correctly so it can be reloaded
      section: quartier,
      zone: quartier ? quartier.value : '',
      lat: Number(lat) || 0,
      long: Number(long) || 0,
    },

    // Top-level convenience fields
    zone: quartier ? quartier.value : '',
    area: Number(area) || 0,
    bedrooms: Number(partNumber) || 0,

    offerType: offerType && offerType.value ? { label: offerType.label, value: offerType.value } : offerType,
    surface: surface,
    price: Number(price) || 0,
    // Use the correctly processed commodities
    commodites: processedCommodities,
    partNumber: partNumber,
    imageUrl: imageUrl,
    description: description,
    furnishing: furnishing && furnishing.value ? { label: furnishing.label, value: furnishing.value } : null,
    isFurnished: typeof isFurnished === 'boolean' ? isFurnished : Boolean(furnishing && furnishing.value && !String(furnishing.value).toLowerCase().includes('non')),
    houseType: houseType && houseType.value ? { label: houseType.label, value: houseType.value } : houseType,
    adVance: Number(adVance) || 0,
    houseInsides: houseInsides,
    housingDeposit: Number(housingDeposit) || 0,
    rentalDeposit: Number(rentalDeposit) || 0,
    rentalStatus: rentalStatus || '',
    reservationDetails: reservationDetails || null,
    isPurchaseMode: Boolean(isPurchaseMode),
    type: 'house',
    likes: [],
    userId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}


export const sliderConstructorCreate = (data, edit) => {
  const typeValue = {}
  if (data.type.value !== 'social') {
    typeValue[data.type.value] = data[data.type.value].value
  } else {
    typeValue.externalLink = data.externalLink
    typeValue.externalLinkFallback = data.externalLinkFallback
  }


  const conditionalProps = edit ? {
    updatedAt: serverTimestamp(),
  } : {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  return {
    sliderDetails: {
      title: data.title,
      description: data.description
    },
    ...typeValue,
    imageHash: data.imageHash,
    imageUrl: data.imageUrl,
    imageUrl1000: data.imageUrl1000,
    type: data.type.value,
    typeLabel: data.type.label,
    isActive: data.isActive,
    ...conditionalProps
  }
}

export const sponsorConstructorCreate = (data, edit) => {
  const conditionalProps = edit ? {
    updatedAt: serverTimestamp(),
  } : {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  return {
    restaurant: {
      name: data.restaurant.label,
      id: data.restaurant.value,
    },
    type: data.type.value,
    periode: {
      startDate: Timestamp.fromDate(new Date(data.startDate)).toDate(),
      endDate: Timestamp.fromDate(new Date(data.endDate)).toDate(),
    },
    isActive: data.isActive,
    ...conditionalProps
  }
}

export const collectionConstructorCreate = (data, edit) => {
  const conditionalProps = edit ? {
    updatedAt: serverTimestamp(),
  } : {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  return {
    title: data.title,
    restaurantIds: data.restaurants.map(restaurant => restaurant.value),
    restaurants: data.restaurants,
    color: stringToColour(data.title),
    isDefault: false,
    nbPlaces: data.restaurants?.length,
    ...conditionalProps
  }
}
export const advertisingConstructorCreate = (data, edit) => {

  const conditionalProps = edit ? {
    updatedAt: serverTimestamp(),
  } : {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  return {
    title: data.title,
    slogan: data.slogan,
    // externalLink: data.externalLink,
    // externalLinkFallback: data.externalLinkFallback,
    imageUrl: data.imageUrl,
    // isActive: data.isActive,
    ...conditionalProps
  }
}

export const categoryConstructorCreate = (data, edit) => {

  const conditionalProps = edit ? {
    updatedAt: serverTimestamp(),
  } : {
    nbPlaces: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  return {
    name: data.name,
    imageHash: data.imageHash,
    imageUrl: data.imageUrl,
    imageUrl1000: data.imageUrl1000,
    isActive: data.isActive,
    ...conditionalProps
  }
}

export const bundleConstructorCreate = (data, edit) => {

  const conditionalProps = edit ? {
    updatedAt: serverTimestamp(),
  } : {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const conditionalCategoriesId = data.hasCategories ? {
    categories: data.categoriesId || []
  } : {}

  return {
    name: data.name,
    imageHash: data.imageHash,
    imageUrl: data.imageUrl,
    imageUrl1000: data.imageUrl1000,
    hasCategories: data.hasCategories,
    isActive: data.isActive,
    ...conditionalProps,
    ...conditionalCategoriesId
  }
}

export const dishConstructorCreate = (data, edit) => {

  const conditionalProps = edit ? {
    updatedAt: serverTimestamp(),
  } : {
    likerCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  return {
    name: data.name,
    speciality: data.speciality,
    description: data.description,
    foodGenericId: data.foodGenericId,
    ingredients: data.ingredients,
    imageHash: data.imageHash,
    imageUrl: data.imageUrl,
    imageUrl1000: data.imageUrl1000,
    isActive: data.isActive,
    ...conditionalProps,
  }
}


export const getGeoPoint = (lat, long) => {
  if (!lat) return null;
  const hash = encode(lat, long, 9);
  return {
    geohash: hash,
    geopoint: new GeoPoint(lat, long),
  }
}

// Form

export const autoFillRestaurantForm = (reset, setValue, restaurant) => {
  if (!restaurant) {
    reset()
    return
  }

  const {
    restaurant: storename,
    manager,
    adress,
    isActive,
  } = restaurant
  setValue('storename', storename?.name)
  setValue('description', storename?.description)
  setValue('firstname', manager?.firstname)
  setValue('lastname', manager?.lastname)
  setValue('phoneNumber', manager?.phoneNumber)
  setValue('email', manager?.email)
  setValue('position', manager?.position)
  setValue('nif', storename?.nif)
  setValue('rccm', storename?.rccm)
  setValue('otherAcc', storename.otherAcc)
  setValue('restaurantPhoneNumber', storename.phoneNumber)
  setValue('lat', adress?.lat)
  setValue('long', adress?.long)
  setValue('restaurantEmail', storename?.email)
  setValue('indication', adress?.description)
  setValue('zone', { value: adress?.zone, label: adress?.zone })
  setValue('quartier', { value: adress?.quartier, label: adress?.quartier })
  setValue('isActive', isActive)
}


export const autoFillHouseForm = (reset, setValue, house) => {
  if (!house) {
    reset()
    return
  }

  const {
    price,
    phoneNumber,
    imageUrl,
    adVance,
    houseType,
    description,
    address,
    partNumber,
    houseInsides,
    surface,
    commodite,
    offerType,
    isAvailable,

  } = house

  const addr = address || house.adress || {}

  setValue('description', description)
  setValue('price', price)
  setValue('adVance', adVance)
  setValue('partNumber', partNumber)
  setValue('surface', surface)
  setValue('offerType', { value: offerType?.value, label: offerType?.value })
  const displayPhone = phoneNumber ? String(phoneNumber).replace(/^(?:\+224|00224)/, '') : undefined
  setValue('phoneNumber', displayPhone)
  setValue('surface', surface)
  // Commodities: form expects single select `commodite` but stored data is `commodites` array
  // Commodities: form using MultiSelect expects an array of strings
  const commodityList = house?.commodites || (Array.isArray(commodite) ? commodite : commodite ? [commodite] : [])
  setValue('commodites', commodityList)
  setValue('houseType', houseType && houseType.value ? { value: houseType.value, label: houseType.label } : houseType)

  // Bedrooms / area / furnishing
  setValue('partNumber', partNumber)
  setValue('bedrooms', (house?.bedrooms ?? Number(partNumber)) || 0)
  setValue('area', house?.area ?? 0)
  setValue('furnishing', house?.furnishing ? { value: house.furnishing.value, label: house.furnishing.label } : undefined)

  // Address fields (support legacy `adress` and new `address`)
  setValue('section', addr?.section ? { value: addr.section.value || addr.section, label: addr.section.label || addr.section } : undefined)
  setValue('long', Number(addr?.long))
  setValue('lat', Number(addr?.lat))
  setValue('zone', addr?.commune ? { value: addr?.commune.value || addr?.zone, label: addr?.commune.label || addr?.zone } : addr?.zone ? { value: addr.zone, label: addr.zone } : undefined)
  setValue('isAvailable', isAvailable)
  setValue('imageUrl', imageUrl)
  setValue('houseInsides', houseInsides)

  // Financial / reservation fields
  setValue('housingDeposit', house?.housingDeposit ?? 0)
  setValue('rentalDeposit', house?.rentalDeposit ?? 0)
  setValue('rentalStatus', house?.rentalStatus ?? '')
  setValue('reservationDetails', house?.reservationDetails ?? null)

  // Furnishing / booleans
  setValue('isFurnished', typeof house?.isFurnished === 'boolean' ? house.isFurnished : Boolean(house?.furnishing))
  setValue('isPurchaseMode', typeof house?.isPurchaseMode === 'boolean' ? house.isPurchaseMode : false)

  // Town (if present)
  setValue('town', house?.address?.town ? { value: house.address.town.value, label: house.address.town.label } : undefined)
}











export const autoFillSliderForm = (reset, setValue, slider) => {
  if (!slider) {
    reset()
    return
  }

  const {
    sliderDetails,
    type,
    typeLabel,
    isActive,
    imageHash,
    externalLink,
    externalLinkFallback,
  } = slider
  setValue('title', sliderDetails.title)
  setValue('description', sliderDetails.description)
  setValue('type', { value: type, label: typeLabel })
  setValue('restaurant', { value: slider[type], label: slider[type]?.name })
  setValue('collection', { value: slider[type], label: slider[type]?.title })
  setValue('social', { value: slider[type], label: slider[type] })
  setValue('isActive', isActive)
  setValue('imageHash', imageHash)
  setValue('externalLink', externalLink)
  setValue('externalLinkFallback', externalLinkFallback)
}

export const autoFillSponsorForm = (reset, setValue, sponsor) => {
  if (!sponsor) {
    reset()
    return
  }

  const {
    restaurant,
    periode,
    type,
    isActive,
  } = sponsor

  setValue('restaurant', { value: restaurant.name, label: restaurant.name })
  setValue('startDate', firebaseDateToJsDate(periode.startDate).toISOString().split('T')[0])
  setValue('endDate', firebaseDateToJsDate(periode.endDate).toISOString().split('T')[0])
  setValue('type', { value: type, label: type })
  setValue('isActive', isActive)

}

export const autoFillAdvertisingForm = (reset, setValue, advertising) => {
  if (!advertising) {
    reset()
    return
  }

  const {
    title,
    slogan,
    imageUrl
  } = advertising
  setValue('title', title)
  setValue('slogan', slogan)
  // setValue('externalLink', externalLink)
  // setValue('externalLinkFallback', externalLinkFallback)
  // setValue('isActive', isActive)
  setValue('imageHash', imageUrl)
}





export const autoFillCommercialForm = (reset, setValue, commercial) => {
  if (!commercial) {
    reset()
    return
  }

  const {
    title,
    slogan,
    externalLink,
    externalLinkFallback,
    isActive,
    imageHash,
  } = commercial
  setValue('title', title)
  setValue('slogan', slogan)
  setValue('externalLink', externalLink)
  setValue('externalLinkFallback', externalLinkFallback)
  setValue('isActive', isActive)
  setValue('imageHash', imageHash)
}





export const autoFillCollectionForm = (reset, setValue, collection) => {
  if (!collection) {
    reset()
    return
  }

  const {
    title,
    restaurants
  } = collection
  setValue('title', title)
  setValue('restaurants', restaurants)

}

export const autoFillCategoryForm = (reset, setValue, category) => {
  if (!category) {
    reset()
    return
  }

  const {
    name,
    imageHash,
    isActive
  } = category
  setValue('name', name)
  setValue('isActive', isActive)
  setValue('imageHash', imageHash)
}

export const autoFillBundleForm = (reset, setValue, bundle) => {
  if (!bundle) {
    reset()
    return
  }

  const {
    name,
    imageHash,
    categories,
    isActive,
    hasCategories
  } = bundle
  setValue('name', name)
  setValue('isActive', isActive)
  setValue('hasCategories', hasCategories)
  if (hasCategories) setValue('categoriesId', categories)
  setValue('imageHash', imageHash)
}
export const autoFillDishForm = (reset, setValue, dish) => {
  if (!dish) {
    reset()
    return
  }

  const {
    name,
    imageHash,
    foodGenericId,
    ingredients,
    likerCount,
    speciality,
    isActive,
    description
  } = dish
  setValue('name', name)
  setValue('isActive', isActive)
  setValue('description', description)
  setValue('foodGenericId', foodGenericId)
  setValue('ingredients', ingredients)
  setValue('likerCount', likerCount)
  setValue('speciality', speciality)
  setValue('imageHash', imageHash)
}

export const getObjectInString = (str) => {
  return JSON.parse(str.substring(str.indexOf('{'), str.lastIndexOf('}') + 1))
}






export const desableHouseToFirestore = async (houseId, isAvailable) => {

  await updateDoc(houseRef(houseId), { isAvailable: isAvailable })


}






export const desableUser = async (userId, desable) => {

  try {
    fetch('/api/userActivity/desableUser', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        id: userId,
        isActive: desable,
      }),
    })
  } catch (error) {
    console.log('error: ', error)
  }
}

export const dailyRentalRef = (id) => doc(db, `daily_rentals/${id}`)
export const landRef = (id) => doc(db, `lands/${id}`)

export const desableDailyRentalToFirestore = async (id, isAvailable) => {
  await updateDoc(dailyRentalRef(id), { isAvailable: isAvailable })
}

export const desableLandToFirestore = async (id, isAvailable) => {
  await updateDoc(landRef(id), { isAvailable: isAvailable })
}

export const dailyRentalConstructorCreate = ({
  checkInHour,
  checkOutHour,
  maxGuests,
  maxStay,
  minStay,
  pricePerDay,
  pricePerHour,
  pricePerMonth,
  pricePerNight,
  pricePerWeek,
  amenities = [],
  // Common fields with houses
  phoneNumber,
  section,
  imageUrl,
  houseType,
  description,
  long,
  lat,
  partNumber = 0,
  houseInsides,
  zone,
  offerType,
  isAvailable,
  userId,
  town,
  rentalStatus = '',
  reservationDetails = null,
}) => {
  // Normalize select objects
  const commune = zone && zone.label && zone.value ? { label: zone.label, value: zone.value, lat: Number(lat) || 0, long: Number(long) || 0 } : zone || null
  const quartier = section && section.label && section.value ? { label: section.label, value: section.value } : section || null
  const townObj = town && town.label && town.value ? { label: town.label, value: town.value } : { label: 'Conakry', value: 'conakry' }

  return {
    // Specific Daily Rental fields
    checkInHour: Number(checkInHour) || 0,
    checkOutHour: Number(checkOutHour) || 0,
    maxGuests: Number(maxGuests) || 0,
    maxStay: Number(maxStay) || 0,
    minStay: Number(minStay) || 0,
    pricePerDay: Number(pricePerDay) || 0,
    pricePerHour: Number(pricePerHour) || 0,
    pricePerMonth: Number(pricePerMonth) || 0,
    pricePerNight: Number(pricePerNight) || 0,
    pricePerWeek: Number(pricePerWeek) || 0,
    amenities: Array.isArray(amenities) ? amenities : amenities ? [amenities] : [],
    bedrooms: Number(partNumber) || 0,

    // Common fields
    phoneNumber,
    isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
    address: {
      commune: commune,
      town: townObj,
      zone: quartier ? quartier.value : '',
      lat: Number(lat) || 0,
      long: Number(long) || 0,
    },
    zone: quartier ? quartier.value : '', // Keeping this for backward compatibility if needed, though structure shows it in address

    offerType: offerType && offerType.value ? { label: offerType.label, value: offerType.value } : offerType,
    imageUrl: imageUrl,
    description: description,
    houseType: houseType && houseType.value ? { label: houseType.label, value: houseType.value } : houseType,
    houseInsides: houseInsides,
    rentalStatus: rentalStatus || '',
    reservationDetails: reservationDetails || null,

    type: 'daily_rental',
    userId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}



export const autoFillDailyRentalForm = (reset, setValue, data) => {
  if (!data) {
    reset()
    return
  }

  const {
    address,
    checkInHour,
    checkOutHour,
    maxGuests,
    maxStay,
    minStay,
    pricePerDay,
    pricePerHour,
    pricePerMonth,
    pricePerNight,
    pricePerWeek,
    amenities,
    bedrooms,
    phoneNumber,
    isAvailable,
    imageUrl,
    description,
    houseType,
    offerType,
    houseInsides,
    rentalStatus,
    reservationDetails
  } = data

  const addr = address || data.address || {}

  setValue('description', description)
  setValue('checkInHour', checkInHour)
  setValue('checkOutHour', checkOutHour)
  setValue('maxGuests', maxGuests)
  setValue('maxStay', maxStay)
  setValue('minStay', minStay)

  setValue('pricePerDay', pricePerDay)
  setValue('pricePerHour', pricePerHour)
  setValue('pricePerMonth', pricePerMonth)
  setValue('pricePerNight', pricePerNight)
  setValue('pricePerWeek', pricePerWeek)

  setValue('partNumber', bedrooms) // reuse partNumber for bedrooms in form

  setValue('offerType', { value: offerType?.value, label: offerType?.value })
  const displayPhone = phoneNumber ? String(phoneNumber).replace(/^(?:\+224|00224)/, '') : undefined
  setValue('phoneNumber', displayPhone)

  // Amenities
  // Amenities
  const validAmenities = Array.isArray(amenities) ? amenities : (amenities ? [amenities] : []);
  setValue('amenities', validAmenities);

  setValue('houseType', houseType && houseType.value ? { value: houseType.value, label: houseType.label } : houseType)

  // Address fields
  // Address fields
  const sectionValue = addr?.section
    ? (addr.section.value || addr.section)
    : (typeof addr?.zone === 'string' ? addr.zone : undefined)

  setValue('section', sectionValue ? { value: sectionValue, label: sectionValue } : undefined)
  setValue('long', Number(addr?.long))
  setValue('lat', Number(addr?.lat))
  setValue('zone', addr?.commune ? { value: addr?.commune.value || addr?.zone, label: addr?.commune.label || addr?.zone } : addr?.zone ? { value: addr.zone, label: addr.zone } : undefined)

  setValue('isAvailable', isAvailable)
  setValue('imageUrl', imageUrl)
  setValue('houseInsides', houseInsides)

  setValue('rentalStatus', rentalStatus || '')
  setValue('reservationDetails', reservationDetails || null)

  // Town
  setValue('town', data?.address?.town ? { value: data.address.town.value, label: data.address.town.label } : undefined)
}

