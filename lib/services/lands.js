import {
    collection,
    deleteDoc,
    doc,
    updateDoc,
    addDoc,
    getDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import {
    landConstructorCreate,
} from '../models/Land'
import {
    deleteStorageImage,
    getDefaultImageDownloadURL,
} from '@/utils/firebase/storage'

export const landsCollectionRef = collection(db, `lands`)

export const landDocRef = (landId) => doc(db, `lands/${landId}`)

export const editLand = async (land, data, imagefiles) => {
    if (!data.imageUrl) {
        deleteStorageImage(land?.imageUrl)
    }

    const existingImages = land?.images || land?.houseInsides || []
    if (imagefiles.length > 0) {
        existingImages.map((imageUrl) => {
            return deleteStorageImage(imageUrl)
        })
    }

    const imageUrl =
        typeof data.imageUrl === 'string'
            ? land.imageUrl
            : await getDefaultImageDownloadURL(data.imageUrl[0], `houseImages`)

    const housImageUrls =
        imagefiles.length > 0
            ? imagefiles.map((imageUrl) => {
                return getDefaultImageDownloadURL(imageUrl, `houseImages`)
            })
            : existingImages

    const images = await Promise.all(housImageUrls)

    const dataUpdate = landConstructorCreate({
        ...data,
        imageUrl,
        images,
        userId: land.userId,
    })
    delete dataUpdate.createdAt
    delete dataUpdate.likes

    if (dataUpdate.userId === undefined) {
        delete dataUpdate.userId
    }

    await updateDoc(
        landDocRef(land?.id),
        dataUpdate
    )

    return dataUpdate
}

export const deleteLand = async (land) => {
    deleteStorageImage(land?.imageUrl)

    const existingImages = land?.images || land?.houseInsides || []
    existingImages.map((imageUrl) => {
        return deleteStorageImage(imageUrl)
    })

    await deleteDoc(landDocRef(land?.id))
}

export const addLand = async (data) => {
    const imageUrl = await getDefaultImageDownloadURL(
        data.imageUrl[0],
        `houseImages`
    )

    const housImageUrls = data.insideImages.map((imageUrl) => {
        return getDefaultImageDownloadURL(imageUrl, `houseImages`)
    })

    const images = await Promise.all(housImageUrls)

    const structuredData = landConstructorCreate({
        ...data,
        imageUrl,
        images,
        isAvailable: data.isAvailable ?? true,
    })

    const docRef = await addDoc(landsCollectionRef, structuredData)

    structuredData.id = docRef.id

    return structuredData
}

export const getLandById = async (id) => {
    const docSnap = await getDoc(landDocRef(id))
    if (docSnap.exists()) {
        return docSnap.data()
    }
    return null
}
