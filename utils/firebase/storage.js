import { storage } from "../../lib/firebase/client_config.js";
import { ref, uploadBytes, getDownloadURL, getStorage, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

export const uploadFile = (file, folderName) => {
  if (!file)
    return new Promise((resolve) => {
      resolve(null);
    });

  const ext = file.name.split(".").pop(); // Extract image extension
  const filename = `${uuidv4()}.${ext}`; // Generate unique name
  const fileRef = ref(storage, `${folderName}/${filename}`);
  return uploadBytes(fileRef, file);
};

export const deleteStorageImage = (imageUrl) => {
  const storage = getStorage();
  // Create a reference to the file to delete
  const desertRef = ref(storage, imageUrl);
  // Delete the file
  deleteObject(desertRef)
    .then(() => {
      console.log(`image supprimee avec succes`);
    })
    .catch((erro) => {
      console.log('erorr error', erro)

    });
};
export const deleteResizedStorageImage = (primaryUrl, size = '200x200') => {
  const resizeUrl = getImageLinkBySize(primaryUrl, size);
  deleteStorageImage(resizeUrl)
};


export const getImageLinkBySize = (primaryUrl, size) => {
  const withOutToken = primaryUrl.split('&')[0];

  const splitedurl = withOutToken.split('.');
  const lastElement = splitedurl.pop();
  const firstElement = splitedurl.join('.');

  const resizeUrl = `${firstElement}_${size}.${lastElement}`;

  return resizeUrl;
}

export const getImageDownloadURL = async (file, folderName) => {
  const result = await uploadFile(file, folderName);
  const nameImage = result.ref.name.split(".");
  const storageRef = ref(`${folderName}/${nameImage[0]}_200x200.${nameImage[1]}`);

  return keepTrying(10, storageRef).then((url) => url);
};

export const getDefaultImageDownloadURL = async (file, folderName) => {
  const result = await uploadFile(file, folderName);
  return getDownloadURL(result.ref)
    .then((url) => {
      return url;
    })
}

export const getDefaultImageDownloadURLs = async (files, folderName) => {
  const imagesInsides = []
  files.map((file) => {
    getDownloadURL(file.ref)
      .then((url) => {
        // return url;
        imagesInsides.push(url);
      })

  })
  return imagesInsides

}
