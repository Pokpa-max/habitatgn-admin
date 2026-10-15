import { addDoc, collection, doc, deleteDoc, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase/client_config";

export const parseDocsData = (snapshot) => {
  const data = [];
  snapshot.forEach((doc) => {
    data.push({ ...doc.data(), id: doc.id });
  });

  return data;
};
