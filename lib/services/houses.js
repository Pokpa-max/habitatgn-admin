import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { firestoreAutoId, parseDocsData } from '@/utils/firebase/firestore'
import { fetchWithPost } from '../../utils/fetch'
import {
  houseConstructorUpdate,
  housesConstructorCreate,
} from '../../utils/functionFactory'
import {
  deleteResizedStorageImage,
  deleteStorageImage,
  getDefaultImageDownloadURL,
  getDefaultImageDownloadURLs,
} from '@/utils/firebase/storage'

export const housesCollectionRef = collection(db, `houses`)

export const restaurantDocRef = (restaurantId) =>
  doc(db, `restaurants/${restaurantId}`)

export const houseDocRef = (houseId) => doc(db, `houses/${houseId}`)

export const editHouse = async (house, data, imagefiles, userId) => {
  if (!data.imageUrl) {
    deleteStorageImage(house?.imageUrl)
  }
  if (imagefiles.length > 0) {
    house?.houseInsides.map((imageUrl) => {
      return deleteStorageImage(imageUrl)
    })
  }

  const imageUrl =
    typeof data.imageUrl === 'string'
      ? house.imageUrl
      : await getDefaultImageDownloadURL(data.imageUrl[0], `houseImages`)

  const housImageUrls =
    imagefiles.length > 0
      ? imagefiles.map((imageUrl) => {
        return getDefaultImageDownloadURL(imageUrl, `houseImages`)
      })
      : house.houseInsides

  const houseInsides = await Promise.all(housImageUrls)

  const dataUpdate = housesConstructorCreate({
    ...data,
    imageUrl,
    houseInsides,
    userId: house.userId,
  })
  delete dataUpdate.createdAt
  delete dataUpdate.likes  // ne pas écraser les likes existants lors d'une modification

  await updateDoc(
    houseDocRef(house?.id),
    dataUpdate
  )

  return dataUpdate

}

export const deleteHouse = async (house) => {
  deleteStorageImage(house?.imageUrl)

  house?.houseInsides.map((imageUrl) => {
    return deleteStorageImage(imageUrl)
  })

  await deleteDoc(houseDocRef(house?.id))
}

export const addHouses = async (data) => {
  const imageUrl = await getDefaultImageDownloadURL(
    data.imageUrl[0],
    `houseImages`
  )

  const housImageUrls = data.insideImages.map((imageUrl) => {
    return getDefaultImageDownloadURL(imageUrl, `houseImages`)
  })

  const houseInsides = await Promise.all(housImageUrls)

  const structuredData = housesConstructorCreate({
    ...data,
    imageUrl,
    houseInsides,
    isAvailable: data.isAvailable ?? true,
  })

  const doc = await addDoc(housesCollectionRef, structuredData)

  structuredData.id = doc.id

  return structuredData
}

export const deleteRestaurant = async (restaurantId) => {
  await deleteDoc(restaurantDocRef(restaurantId))
}

export const createAccount = async (data) => {
  //creating account
  const { firstname, lastname } = data
  const name = `${firstname} ${lastname}`
  const response = await fetchWithPost('api/createUser', {
    email: data.restaurantEmail,
    name,
  })
  if (response.code != 'ok') throw new Error(response.message)
}


// ----------------------------------------------------------------------------
