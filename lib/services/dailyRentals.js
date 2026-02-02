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
    if (imagefiles.length > 0) {
        dailyRental?.houseInsides.map((imageUrl) => {
            return deleteStorageImage(imageUrl)
        })
    }

    const imageUrl =
        typeof data.imageUrl === 'string'
            ? dailyRental.imageUrl
            : await getDefaultImageDownloadURL(data.imageUrl[0], `houseImages`)

    const housImageUrls =
        imagefiles.length > 0
            ? imagefiles.map((imageUrl) => {
                return getDefaultImageDownloadURL(imageUrl, `houseImages`)
            })
            : dailyRental.houseInsides

    const houseInsides = await Promise.all(housImageUrls)

    const dataUpdate = dailyRentalConstructorCreate({
        ...data,
        imageUrl,
        houseInsides,
        userId: dailyRental.userId || currentUserId,
    })
    delete dataUpdate.createdAt

    await updateDoc(
        dailyRentalDocRef(dailyRental?.id),
        dataUpdate
    )

    return dataUpdate
}

export const deleteDailyRental = async (dailyRental) => {
    deleteStorageImage(dailyRental?.imageUrl)

    dailyRental?.houseInsides.map((imageUrl) => {
        return deleteStorageImage(imageUrl)
    })

    await deleteDoc(dailyRentalDocRef(dailyRental?.id))
}

export const addDailyRental = async (data) => {
    const imageUrl = await getDefaultImageDownloadURL(
        data.imageUrl[0],
        `houseImages`
    )

    const housImageUrls = data.insideImages.map((imageUrl) => {
        return getDefaultImageDownloadURL(imageUrl, `houseImages`)
    })

    const houseInsides = await Promise.all(housImageUrls)

    const structuredData = dailyRentalConstructorCreate({
        ...data,
        imageUrl,
        houseInsides,
        isAvailable: data.isAvailable ?? true,
    })

    const doc = await addDoc(dailyRentalsCollectionRef, structuredData)

    structuredData.id = doc.id

    return structuredData
}
