import {
    collection,
    deleteDoc,
    doc,
    updateDoc,
    addDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import {
    dailyRentalConstructorCreate,
} from '../../utils/functionFactory'
import {
    deleteStorageImage,
    getDefaultImageDownloadURL,
} from '@/utils/firebase/storage'

export const dailyRentalsCollectionRef = collection(db, `daily_rentals`)

export const dailyRentalDocRef = (dailyRentalId) => doc(db, `daily_rentals/${dailyRentalId}`)

export const editDailyRental = async (dailyRental, data, imagefiles, currentUserId) => {
    if (!data.imageUrl) {
        deleteStorageImage(dailyRental?.imageUrl)
    }

    const existingImages = dailyRental?.images || dailyRental?.houseInsides || []
    if (imagefiles.length > 0) {
        existingImages.map((imageUrl) => {
            return deleteStorageImage(imageUrl)
        })
    }

    const imageUrl =
        typeof data.imageUrl === 'string'
            ? dailyRental.imageUrl
            : await getDefaultImageDownloadURL(data.imageUrl[0], `houseImages`)

    const imageUrls =
        imagefiles.length > 0
            ? imagefiles.map((imageUrl) => {
                return getDefaultImageDownloadURL(imageUrl, `houseImages`)
            })
            : existingImages

    const images = await Promise.all(imageUrls)

    const dataUpdate = dailyRentalConstructorCreate({
        ...data,
        imageUrl,
        images,
        userId: dailyRental.userId || currentUserId,
    })
    delete dataUpdate.createdAt
    delete dataUpdate.likes

    await updateDoc(
        dailyRentalDocRef(dailyRental?.id),
        dataUpdate
    )

    return dataUpdate
}

export const deleteDailyRental = async (dailyRental) => {
    deleteStorageImage(dailyRental?.imageUrl)

    const existingImages = dailyRental?.images || dailyRental?.houseInsides || []
    existingImages.map((imageUrl) => {
        return deleteStorageImage(imageUrl)
    })

    await deleteDoc(dailyRentalDocRef(dailyRental?.id))
}

export const addDailyRental = async (data) => {
    const imageUrl = await getDefaultImageDownloadURL(
        data.imageUrl[0],
        `houseImages`
    )

    const imageUrls = data.insideImages.map((imageUrl) => {
        return getDefaultImageDownloadURL(imageUrl, `houseImages`)
    })

    const images = await Promise.all(imageUrls)

    const structuredData = dailyRentalConstructorCreate({
        ...data,
        imageUrl,
        images,
        isAvailable: data.isAvailable ?? true,
    })

    const docRef = await addDoc(dailyRentalsCollectionRef, structuredData)

    structuredData.id = docRef.id

    return structuredData
}
