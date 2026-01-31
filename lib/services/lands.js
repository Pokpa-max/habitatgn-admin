import {
    collection,
    deleteDoc,
    doc,
    updateDoc,
    addDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import {
    landConstructorCreate,
} from '../../utils/functionFactory'
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
    if (imagefiles.length > 0) {
        land?.houseInsides.map((imageUrl) => {
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
            : land.houseInsides

    const houseInsides = await Promise.all(housImageUrls)

    const dataUpdate = landConstructorCreate({
        ...data,
        imageUrl,
        houseInsides,
        userId: land.userId,
    })
    delete dataUpdate.createdAt

    await updateDoc(
        landDocRef(land?.id),
        dataUpdate
    )

    return dataUpdate
}

export const deleteLand = async (land) => {
    deleteStorageImage(land?.imageUrl)

    land?.houseInsides.map((imageUrl) => {
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

    const houseInsides = await Promise.all(housImageUrls)

    const structuredData = landConstructorCreate({
        ...data,
        imageUrl,
        houseInsides,
        isAvailable: data.isAvailable ?? true,
    })

    const doc = await addDoc(landsCollectionRef, structuredData)

    structuredData.id = doc.id

    return structuredData
}
