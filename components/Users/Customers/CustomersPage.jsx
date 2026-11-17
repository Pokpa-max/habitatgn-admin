import React from 'react'
import UsersList from '../UsersList'
import { db } from '@/lib/firebase/client_config'

import { parseDocsData } from '@/utils/firebase/firestore'

import {
  collection,
  getDocs,
  limit,
  query,
  startAfter,
  where,
} from 'firebase/firestore'
import { useState } from 'react'
import { useEffect } from 'react'
import { HITS_PER_PAGE } from '../../../lib/constants'

/**
 * Comptes créés sur le site public : le site enregistre `role` (user, agent,
 * worker), jamais `type: 'customer'` — l'ancienne requête renvoyait 0.
 */
export const SITE_ROLES = ['user', 'agent', 'worker']

/** Fiche site -> champs attendus par le tableau (nom, photo, rôle, actif). */
const normalizeSiteUser = (user) => ({
  ...user,
  name: user.name || user.displayName || [user.firstname, user.lastname].filter(Boolean).join(' ') || '—',
  image_url: user.image_url || user.photoURL || '',
  type: user.type || user.role,
  isAvailable: user.isAvailable !== false && user.disabled !== true,
})

const newestFirst = (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)

function CustomersPage() {
  const [data, setData] = useState(null)
  const [pagination, setPagination] = useState({
    page: 0,
    nbHits: 0,
    showPagination: true,
  })
  const [isLoadingP, setIsLoadingP] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const userRef = collection(db, 'users')
    const fetchData = async () => {
      setIsLoading(true)
      const q = query(userRef, where('role', 'in', SITE_ROLES), limit(HITS_PER_PAGE))

      const querySnapshot = await getDocs(q)
      const users = parseDocsData(querySnapshot).map(normalizeSiteUser).sort(newestFirst)
      setData({
        users,
        lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
      })
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const usersToShow = data?.users ?? []
  const showMoreFirestore = async () => {
    const customerRef = collection(db, 'users')
    setIsLoadingP(true)
    const lastElement = data.lastElement

    const q = query(customerRef, where('role', 'in', SITE_ROLES), startAfter(lastElement), limit(HITS_PER_PAGE))
    const querySnapshot = await getDocs(q)
    const users = parseDocsData(querySnapshot).map(normalizeSiteUser)
    const nextData = {
      users: [...data.users, ...users].sort(newestFirst),
      lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
    }

    setPagination({ ...pagination, showPagination: users.length > 0 })

    setData(nextData)
    setIsLoadingP(false)
  }

  return (
    <UsersList
      title={'Utilisateurs'}
      setData={setData}
      data={data}
      customers={usersToShow}
      showMore={showMoreFirestore}
      pagination={pagination.showPagination}
      isLoading={isLoading}
      isLoadingP={isLoadingP}
    />
  )
}

export default CustomersPage
