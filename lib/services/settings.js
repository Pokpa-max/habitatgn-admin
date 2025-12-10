import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    updateDoc,
    addDoc,
    arrayUnion,
    arrayRemove,
    setDoc,
    getDoc,
} from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid'
import { db } from '@/lib/firebase/client_config'
import { parseDocsData } from '@/utils/firebase/firestore'
import { categoryConstructorCreate, bundleConstructorCreate, dishConstructorCreate } from '../../utils/functionFactory'
import { deleteResizedStorageImage, getDefaultImageDownloadURL, getImageLinkBySize } from '../../utils/firebase/storage'
import { encodeImageToBlurhash } from '@/utils/blurHash'
import { notify } from '../../utils/toast'

// Categories

export const categoriesCollectionRef = collection(db, `categories`)

export const categoryDocRef = (categoryId) => doc(db, `categories/${categoryId}`)

export const getCategories = (setState) => {
    return onSnapshot(categoriesCollectionRef, (querySnapshot) => {
        const categories = parseDocsData(querySnapshot)
        setState(categories)
    })
}

export const editCategory = async (categoryId, data, updateImage, oldImageUrl, oldImageUrl1000) => {
    const imageData = {}
    if (updateImage) {
        const imageUrl = await getDefaultImageDownloadURL(data.imageUrl[0], `app/categories`);
        const imageHash = await encodeImageToBlurhash(imageUrl)
        try {
            deleteResizedStorageImage(oldImageUrl, '1000x1000')
            deleteResizedStorageImage(oldImageUrl, '200x200')
        } catch (error) {
            console.log('error', error);
        }




        imageData.imageUrl = imageUrl;
        imageData.imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000');
        imageData.imageHash = imageHash;
    }
    await updateDoc(categoryDocRef(categoryId), categoryConstructorCreate({ ...data, imageUrl: oldImageUrl, imageUrl1000: oldImageUrl1000, ...imageData }, true))
}

export const addCategory = async (data) => {
    const imageUrl = await getDefaultImageDownloadURL(
        data.imageUrl[0],
        `app/categories`
    )

    const imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000')
    const imageHash = await encodeImageToBlurhash(imageUrl)

    await addDoc(categoriesCollectionRef, categoryConstructorCreate({ ...data, imageUrl1000, imageUrl, imageHash }))
}

export const deleteCategory = async (categoryId, imageUrl) => {
    deleteResizedStorageImage(imageUrl, '1000x1000')
    deleteResizedStorageImage(imageUrl, '200x200')
    await deleteDoc(categoryDocRef(categoryId))
}

// Bundle

export const bundlesCollectionRef = collection(db, `bundles`)

export const bundleDocRef = (bundleId) => doc(db, `bundles/${bundleId}`)

export const getBundles = (setState) => {
    return onSnapshot(bundlesCollectionRef, (querySnapshot) => {
        const bundles = parseDocsData(querySnapshot)
        setState(bundles)
    })
}

export const editBundle = async (bundleId, data, updateImage, oldImageUrl, oldImageUrl1000) => {
    const imageData = {}
    if (updateImage) {
        const imageUrl = await getDefaultImageDownloadURL(data.imageUrl[0], `app/bundles`);
        const imageHash = await encodeImageToBlurhash(imageUrl)
        try {
            deleteResizedStorageImage(oldImageUrl, '1000x1000')
            deleteResizedStorageImage(oldImageUrl, '200x200')
        } catch (error) {
            console.log('error22', error);
        }


        imageData.imageUrl = imageUrl;
        imageData.imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000');
        imageData.imageHash = imageHash;
    }
    await updateDoc(bundleDocRef(bundleId), bundleConstructorCreate({ ...data, imageUrl: oldImageUrl, imageUrl1000: oldImageUrl1000, ...imageData }, true))
}

export const addBundle = async (data) => {
    const imageUrl = await getDefaultImageDownloadURL(
        data.imageUrl[0],
        `app/bundles`
    )

    const imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000')
    const imageHash = await encodeImageToBlurhash(imageUrl)

    await addDoc(bundlesCollectionRef, bundleConstructorCreate({ ...data, imageUrl1000, imageUrl, imageHash }))
}

export const deleteBundle = async (bundleId, imageUrl) => {
    deleteResizedStorageImage(imageUrl, '1000x1000')
    deleteResizedStorageImage(imageUrl, '200x200')
    await deleteDoc(bundleDocRef(bundleId))
}

// Dishes

export const dishesCollectionRef = collection(db, `dishs`)

export const dishDocRef = (dishId) => doc(db, `dishs/${dishId}`)

export const getDishes = (setState) => {
    return onSnapshot(dishesCollectionRef, (querySnapshot) => {
        const dishes = parseDocsData(querySnapshot)
        setState(dishes)
    })
}

export const editDish = async (dishId, data, updateImage, oldImageUrl, oldImageUrl1000) => {
    const imageData = {}
    if (updateImage) {
        const imageUrl = await getDefaultImageDownloadURL(data.imageUrl[0], `app/dishs`);
        const imageHash = await encodeImageToBlurhash(imageUrl)
        deleteResizedStorageImage(oldImageUrl, '1000x1000')
        deleteResizedStorageImage(oldImageUrl, '200x200')

        imageData.imageUrl = imageUrl;
        imageData.imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000');
        imageData.imageHash = imageHash;
    }
    await updateDoc(dishDocRef(dishId), dishConstructorCreate({ ...data, imageUrl: oldImageUrl, imageUrl1000: oldImageUrl1000, ...imageData }, true))
}

export const addDish = async (data) => {
    const imageUrl = await getDefaultImageDownloadURL(
        data.imageUrl[0],
        `app/dishs`
    )

    const imageUrl1000 = getImageLinkBySize(imageUrl, '1000x1000')
    const imageHash = await encodeImageToBlurhash(imageUrl)

    await addDoc(dishesCollectionRef, dishConstructorCreate({ ...data, imageUrl1000, imageUrl, imageHash }))
}

export const deleteDish = async (dishId, imageUrl) => {
    deleteResizedStorageImage(imageUrl, '1000x1000')
    deleteResizedStorageImage(imageUrl, '200x200')
    await deleteDoc(dishDocRef(dishId))
}

// AppInfo

export const appInfosCollectionRef = collection(db, `infos`)

export const appInfoDocRef = (infoId) => doc(db, `infos/${infoId}`)

export const getAppInfos = (setState) => {
    return onSnapshot(appInfosCollectionRef, (querySnapshot) => {
        const appInfos = parseDocsData(querySnapshot)

        setState(appInfos)
    })
}


export const addAppInfo = async (data, infoId) => {
    if (data === '') return;
    await updateDoc(appInfoDocRef(infoId), { [infoId]: arrayUnion({ name: data, id: uuidv4() }) })
}

export const deleteAppInfo = async (data, infoId) => {
    await updateDoc(appInfoDocRef(infoId), { [infoId]: arrayRemove(data) })

}

// HomeInfo

export const homeInfosCollectionRef = collection(db, `home`)

export const homeInfoDocRef = (infoId) => doc(db, `home/${infoId}`)

export const getHomeInfos = (setState) => {
    return onSnapshot(homeInfosCollectionRef, (querySnapshot) => {
        const homeInfos = parseDocsData(querySnapshot)
        setState(homeInfos)
    })
}


export const addHomeInfo = async (data, infoId) => {
    if (!data) return;
    await updateDoc(homeInfoDocRef(infoId), { [infoId]: arrayUnion(data?.value) })
}

export const deleteHomeInfo = async (data, infoId) => {
    await updateDoc(homeInfoDocRef(infoId), { [infoId]: arrayRemove(data) })
}

// Generic food

export const genericDishesCollectionRef = collection(db, `foodGeneric`)

export const genericDishDocRef = (dishId) => doc(db, `foodGeneric/${dishId}`)

export const getGenericDishes = (setState) => {
    return onSnapshot(genericDishesCollectionRef, (querySnapshot) => {
        const genericDishes = parseDocsData(querySnapshot)
        setState(genericDishes)
    })
}

export const addGenericDish = async (data) => {
    if (data === '') return;
    if ((await getDoc(genericDishDocRef(data.trim()))).exists()) {
        notify('Element existant', 'error')
        return
    }

    await setDoc(genericDishDocRef(data), { name: data })
}

export const deletegenericDish = async (dishId) => {
    await deleteDoc(genericDishDocRef(dishId))
}