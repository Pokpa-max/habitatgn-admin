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


  isAvailable,

}) => ({
  adress: {
    zone: zone.value,
    section: section,
    long: Number(long),
    lat: Number(lat),
  },
  description: description,
  commodite: commodite,
  adVance: adVance,
  houseType: houseType,
  offerType: offerType,
  phoneNumber: phoneNumber,
  partNumber: partNumber,
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

  isAvailable,

}) => ({
  description: description,
  commodite: commodite,
  adVance: adVance,
  houseType: houseType,
  offerType: offerType,
  phoneNumber: phoneNumber,
  partNumber: partNumber,
  price: price,
  surface: surface,
  imageUrl: imageUrl,
  houseInsides: houseInsides,
  isAvailable: isAvailable,
  "adress.zone": zone.value,
  "adress.section": section,
  "adress.long": Number(long),
  "adress.lat": Number(lat),
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
  partNumber = "",
  houseInsides,
  surface,
  zone,
  commodite = "",
  offerType,
  isAvailable,
  userId

}) => ({

  phoneNumber,
  isAvailable,
  adress: {
    zone: zone.value,
    section: section.value,
    long: Number(long),
    lat: Number(lat),
  },

  offerType: offerType,
  surface: surface,
  price: price,
  commodite: commodite,
  partNumber: partNumber,
  imageUrl: imageUrl,
  description: description,
  houseType: houseType,
  adVance: adVance,
  houseInsides: houseInsides,
  likes: [],
  userId: userId,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})


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
    adress,
    partNumber,
    houseInsides,
    surface,
    commodite,
    offerType,
    isAvailable,

  } = house

  setValue('description', description)
  setValue('price', price)
  setValue('adVance', adVance)
  setValue('partNumber', partNumber)
  setValue('surface', surface)
  setValue('offerType', { value: offerType?.value, label: offerType?.value })
  setValue('phoneNumber', phoneNumber)
  setValue('surface', surface)
  setValue('commodite', { value: commodite?.value, label: commodite?.value })
  setValue('houseType', { value: houseType?.value, label: houseType?.value })
  setValue('section', { value: adress?.section, label: adress?.section })
  setValue('long', Number(adress?.long))
  setValue('lat', Number(adress?.lat))
  setValue('zone', { value: adress?.zone, label: adress?.zone })
  setValue('isAvailable', isAvailable)
  setValue('imageUrl', imageUrl)
  setValue('houseInsides', houseInsides)

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