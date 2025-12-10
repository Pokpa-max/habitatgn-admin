import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { getDefaultImageDownloadURL } from '../../utils/firebase/storage'
import { advertisingConstructorCreate } from '../../utils/functionFactory'
import { db } from '../firebase/client_config'


// advertisings

// export const advertinsingCollectionRef = collection(db, `commercials`)
export const advertinsingCollectionRef = collection(db, "sliderImages")
// sliderImages

export const advertinsingDocRef = (commercialId) => doc(db, `commercials/${commercialId}`)
export const commercialDocRef = (commercialId) => doc(db, `sliderImages/${commercialId}`)


export const addAdvertising = async (data) => {

    const imageUrl = await getDefaultImageDownloadURL(data.imageUrl[0], `pub/advertisings`)
    await addDoc(advertinsingCollectionRef, advertisingConstructorCreate({ ...data, imageUrl }));

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
