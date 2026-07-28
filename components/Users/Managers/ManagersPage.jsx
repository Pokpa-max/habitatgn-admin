import React from 'react'
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

function ManagersPage({ types = ['manager', 'admin'], title = 'Managers' }) {
  const [data, setData] = useState(null)
  const [pagination, setPagination] = useState({
    page: 0,
    nbHits: 0,
    showPagination: true,
  })
  const [isLoadingP, setIsLoadingP] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const managerRef = collection(db, 'users')
    const fetchData = async () => {
      setIsLoading(true)
      const q = query(
        managerRef,
        where('type', 'in', types),
        orderBy('createdAt', 'desc'),
        limit(HITS_PER_PAGE)
      )

      const querySnapshot = await getDocs(q)
      const managers = parseDocsData(querySnapshot)
      setData({
        managers,
        lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
      })
      setIsLoading(false)
    }
    fetchData()
  }, [types])

  const managerToShow = data?.managers ?? []
  const showMoreFirestore = async () => {
    const customerRef = collection(db, 'users')
    setIsLoadingP(true)
    const lastElement = data.lastElement

    const q = query(
      customerRef,
      where('type', 'in', types),
      orderBy('createdAt', 'desc'),
      startAfter(lastElement),
      limit(HITS_PER_PAGE)
    )
    const querySnapshot = await getDocs(q)
    const managers = parseDocsData(querySnapshot)
    const nextData = {
      managers: [...data.managers, ...managers],
      lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
    }

    setPagination({ ...pagination, showPagination: managers.length > 0 })

    setData(nextData)
    setIsLoadingP(false)
  }

  return (
    <UsersList
      title={title}
      isStaffTab
      setData={setData}
      data={data}
      customers={managerToShow}
      showMore={showMoreFirestore}
      pagination={pagination.showPagination}
      isLoading={isLoading}
      isLoadingP={isLoadingP}
    />
  )
}

export default ManagersPage
