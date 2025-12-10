import React from 'react'
import Header from '@/components/Header'
import UsersList from '../UsersList'
import { db } from '@/lib/firebase/client_config'

import { parseDocsData } from '@/utils/firebase/firestore'

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore'
import { useState } from 'react'
import { useEffect } from 'react'
import { HITS_PER_PAGE } from '../../../lib/constants'

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
      const q = query(
        userRef,
        orderBy('createdAt', 'desc'),
        where('type', '==', 'customer'),
        limit(HITS_PER_PAGE)
      )

      const querySnapshot = await getDocs(q)
      const users = parseDocsData(querySnapshot)
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

    const q = query(
      customerRef,
      orderBy('createdAt', 'desc'),
      where('type', '==', 'customer'),
      startAfter(lastElement),
      limit(HITS_PER_PAGE)
    )
    const querySnapshot = await getDocs(q)
    const users = parseDocsData(querySnapshot)
    const nextData = {
      users: [...data.users, ...users],
      lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
    }

    setPagination({ ...pagination, showPagination: users.length > 0 })

    setData(nextData)
    setIsLoadingP(false)
  }

  return (
    <div className="flex-1 py-6">
      <div className="mx-auto px-4 sm:px-6 md:px-8">
        <Header title={'Utilisateurs'} />
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
      </div>
    </div>
  )
}

export default CustomersPage
