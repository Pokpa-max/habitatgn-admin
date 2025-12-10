import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { parseDocsData } from '@/utils/firebase/firestore'
import { commercialConstructorCreate, sliderConstructorCreate, sponsorConstructorCreate, collectionConstructorCreate, advertisingConstructorCreate } from '../../utils/functionFactory'
import { deleteResizedStorageImage, deleteStorageImage, getDefaultImageDownloadURL, getImageLinkBySize } from '../../utils/firebase/storage'

// sliders
export const slidersCollectionRef = collection(db, `sliders`)
export const sliderDocRef = (sliderId) => doc(db, `sliders/${sliderId}`)

export const getSliders = (setState) => {
  return onSnapshot(slidersCollectionRef, (querySnapshot) => {
    const slider = parseDocsData(querySnapshot)
    setState(slider)
  })
}

export const editSlider = async (sliderId, data, updateImage, oldImageUrl, oldImageUrl1000) => {
  const imageData = {}
  if (updateImage) {
    const imageUrl = await getDefaultImageDownloadURL(data.imageUrl[0], `marketing/sliders`);
    const imageHash = await encodeImageToBlurhash(imageUrl)
    deleteResizedStorageImage(oldImageUrl, '1000x1000')
    deleteResizedStorageImage(oldImageUrl, '200x200')

    imageData.imageUrl = imageUrl;
    imageData.imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000');
    imageData.imageHash = imageHash;
  }
  await updateDoc(sliderDocRef(sliderId), sliderConstructorCreate({ ...data, imageUrl: oldImageUrl, imageUrl1000: oldImageUrl1000, ...imageData }, true))
}

export const addSlider = async (data) => {
  const imageUrl = await getDefaultImageDownloadURL(
    data.imageUrl[0],
    `marketing/sliders`
  )

  const imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000')
  const imageHash = await encodeImageToBlurhash(imageUrl)

  await addDoc(slidersCollectionRef, sliderConstructorCreate({ ...data, imageUrl1000, imageUrl, imageHash }))
}

export const deleteSlider = async (sliderId, imageUrl) => {
  deleteResizedStorageImage(imageUrl, '1000x1000')
  deleteResizedStorageImage(imageUrl, '200x200')
  await deleteDoc(sliderDocRef(sliderId))
}

// Sponsoring

export const sponsorsCollectionRef = collection(db, `sponsors`)

export const sponsorDocRef = (sponsorId) => doc(db, `sponsors/${sponsorId}`)

export const getSponsors = (setState) => {
  return onSnapshot(sponsorsCollectionRef, (querySnapshot) => {
    const sponsor = parseDocsData(querySnapshot)
    setState(sponsor)
  })
}

export const editSponsor = async (sponsorId, data) => {
  await updateDoc(sponsorDocRef(sponsorId), sponsorConstructorCreate(data, true))
}

export const addSponsor = async (data) => {
  await addDoc(sponsorsCollectionRef, sponsorConstructorCreate(data))
}

export const deleteSponsor = async (sponsorId) => {
  await deleteDoc(sponsorDocRef(sponsorId))
}

// Commercials

export const commercialsCollectionRef = collection(db, `sliderImages`)

export const commercialDocRef = (commercialId) => doc(db, `sliderImages/${commercialId}`)

export const getAdvertising = (setState) => {
  return onSnapshot(commercialsCollectionRef, (querySnapshot) => {
    const commercials = parseDocsData(querySnapshot)

    setState(commercials)
  })
}


export const editCommercial = async (commercialId, data, updateImage, oldImageUrl) => {
  const imageData = {}
  if (updateImage) {
    const imageUrl = await getDefaultImageDownloadURL(data.imageUrl[0], `pub/advertisings`);
    const imageHash = await encodeImageToBlurhash(imageUrl)
    deleteResizedStorageImage(oldImageUrl, '1000x1000')
    deleteResizedStorageImage(oldImageUrl, '200x200')

    imageData.imageUrl = imageUrl;
    imageData.imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000');
    imageData.imageHash = imageHash;
  }
  await updateDoc(commercialDocRef(commercialId), advertisingConstructorCreate({ ...data, imageUrl: oldImageUrl, ...imageData }, true))
}



export const addCommercial = async (data) => {
  const imageUrl = await getDefaultImageDownloadURL(
    data.imageUrl[0],
    `marketing/commercials`
  )

  const imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000')
  const imageHash = await encodeImageToBlurhash(imageUrl)

  await addDoc(commercialsCollectionRef, commercialConstructorCreate({ ...data, imageUrl1000, imageUrl, imageHash }))
}

export const deleteAdvertising = async (commercialId, imageUrl) => {
  deleteResizedStorageImage(imageUrl, '1000x1000')
  deleteResizedStorageImage(imageUrl, '200x200')
  await deleteDoc(commercialDocRef(commercialId))
}


export const deleteMenu = async (advertingId, menuId) => {
  await deleteDoc(menuDocRef(advertingId, menuId))
}

// Collection

export const collectionsCollectionRef = collection(db, `collections`)

export const collectionDocRef = (collectionId) => doc(db, `collections/${collectionId}`)

export const getCollections = (setState) => {
  return onSnapshot(collectionsCollectionRef, (querySnapshot) => {
    const collection = parseDocsData(querySnapshot)
    setState(collection)
  })
}

export const editCollection = async (collectionId, data) => {
  await updateDoc(collectionDocRef(collectionId), collectionConstructorCreate(data, true))
}

export const addCollection = async (data) => {
  await addDoc(collectionsCollectionRef, collectionConstructorCreate(data))
}

export const deleteCollection = async (collectionId) => {
  await deleteDoc(collectionDocRef(collectionId))
}
