
import {

    getDocs,
    collectionGroup,
    query,

    orderBy,
    limit,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { parseDocsData } from '@/utils/firebase/firestore'

import { HITS_PER_PAGE } from '../constants'



export const getUserOrder = async (setState) => {

    const orderRef = query(
        collectionGroup(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(HITS_PER_PAGE)
    );
    const querySnapshot = await getDocs(orderRef);
    const order = parseDocsData(querySnapshot);

    setState(order);

}