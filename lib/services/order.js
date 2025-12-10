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
import { orders } from './../../_data'
// orders
export const ordersCollectionRef = collection(db, `orders`)
export const orderDocRef = (orderId) => doc(db, `orders/${orderId}`)


export const getOrders = (setState) => {
  // return onSnapshot(ordersCollectionRef, (querySnapshot) => {
  //   const order = parseDocsData(querySnapshot)
  //   setState(order)
  // })


}

export const editOrder = async (data) => {

}

export const archiveOrder = async () => {

}
