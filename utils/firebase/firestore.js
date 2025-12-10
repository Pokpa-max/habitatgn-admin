import { addDoc, collection, doc, deleteDoc, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client_config";

export const addDocument = (collectionPath, data) => {
  return addDoc(collection(db, collectionPath), data);
};

export const updateDocument = (collectionPath, docId, data) => {
  return updateDoc(doc(db, collectionPath, docId), data);
};

export const deleteDocument = (collectionPath, docId) => {
  return deleteDoc(doc(db, collectionPath, docId));
};



export const firestoreAutoId = () => {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let autoId = "";

  for (let i = 0; i < 20; i++) {
    autoId += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return autoId;
};

export const parseDocsData = (snapshot) => {
  const data = [];
  snapshot.forEach((doc) => {
    data.push({ ...doc.data(), id: doc.id });
  });

  return data;
};
