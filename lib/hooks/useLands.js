import { useInfiniteQuery } from '@tanstack/react-query'
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    startAfter,
    where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { parseDocsData } from '@/utils/firebase/firestore'

const USERS_PER_PAGE = 20

// Fetch function for React Query
const fetchLands = async ({ pageParam = null, queryKey }) => {
    const [, { userType, userId }] = queryKey
    const itemsRef = collection(db, 'lands')

    let q = query(itemsRef, orderBy('createdAt', 'desc'), limit(USERS_PER_PAGE))

    // Apply User Filters
    if (userType === 'manager' && userId) {
        q = query(q, where('userId', '==', userId))
    }

    // Apply Pagination
    if (pageParam) {
        q = query(q, startAfter(pageParam))
    }

    const snapshot = await getDocs(q)
    const lands = parseDocsData(snapshot)
    const lastDoc = snapshot.docs[snapshot.docs.length - 1]

    return {
        lands,
        nextPage: lands.length === USERS_PER_PAGE ? lastDoc : undefined,
    }
}

export const useInfiniteLands = (userType, userId) => {
    return useInfiniteQuery({
        queryKey: ['lands', { userType, userId }],
        queryFn: fetchLands,
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        refetchOnWindowFocus: false,
        enabled: !!userId, // Wait for Auth to be ready
    })
}
