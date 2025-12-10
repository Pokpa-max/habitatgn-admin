import { db } from '@/lib/firebase/client_config'
import { useAuthUser } from 'next-firebase-auth'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'
import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { parseDocsData } from '@/utils/firebase/firestore'

function DashbordCard() {
  const AuthUser = useAuthUser()
  const [totalHouses, setTotalHouse] = useState()
  const [totalAvailable, setTotalAvailable] = useState()
  const [users, setUsers] = useState()
  useEffect(() => {
    const houseRef = collection(db, 'houses')
    const userRef = collection(db, 'users')
    const fecthData = async () => {
      const q =
        AuthUser.claims.userType == 'admin'
          ? query(houseRef, orderBy('createdAt', 'desc'))
          : query(
              houseRef,
              where('userId', '==', AuthUser.id),
              orderBy('createdAt', 'desc')
            )
      const qry =
        AuthUser.claims.userType == 'admin'
          ? query(
              houseRef,
              where('type', '==', 'manager'),
              where('isAvailable', '==', false),
              orderBy('createdAt', 'desc')
            )
          : query(
              houseRef,
              where('userId', '==', AuthUser.id),
              where('isAvailable', '==', false),
              orderBy('createdAt', 'desc')
            )
      const qury = query(userRef, orderBy('createdAt', 'desc'))

      const querySnapshot = await getDocs(q)
      const querysnapAvailable = await getDocs(qry)
      const queryUser = await getDocs(qury)
      setTotalHouse(parseDocsData(querySnapshot))
      setTotalAvailable(
        parseDocsData((querysnapAvailable = await getDocs(qry)))
      )
      setUsers(parseDocsData(queryUser))
      const totalHouses = parseDocsData(querySnapshot)
    }
    fecthData()
  }, [AuthUser.id])
  return (
    <div class="mb-2 flex flex-wrap">
      <div class="w-full px-3 pt-3 md:w-1/2 md:pr-2 xl:w-1/3">
        <div class="rounded border bg-cyan-500 p-8 shadow">
          <div class="flex flex-row items-center">
            <div class="flex-shrink pl-1 pr-4">
              <i class="fa fa-wallet fa-2x fa-fw fa-inverse"></i>
            </div>
            <div class="flex-1 text-right">
              <h5 class="text-white">Total Maison</h5>
              <h3 class="text-3xl text-white">
                {totalHouses?.length}
                <span class="text-green-400">
                  <i class="fas fa-caret-down"></i>
                </span>
              </h3>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full px-3 pt-3 md:w-1/2 md:pl-2 xl:w-1/3">
        <div class="rounded border bg-gray-500 p-8 shadow">
          <div class="flex flex-row items-center">
            <div class="flex-shrink pl-1 pr-4">
              <i class="fas fa-users fa-2x fa-fw fa-inverse"></i>
            </div>
            <div class="flex-1 text-right">
              <h5 class="text-white"> Total disponible </h5>
              <h3 class="text-3xl text-white">
                {totalHouses?.length - totalAvailable?.length}
                <span class="text-blue-400">
                  <i class="fas fa-caret-up"></i>
                </span>
              </h3>
            </div>
          </div>
        </div>
      </div>
      {AuthUser.claims.userType == 'admin' ? (
        <div class="w-full px-3 pt-3 md:w-1/2 md:pr-2 xl:w-1/3 xl:pr-3 xl:pl-1">
          <div class="rounded border bg-gray-500 p-8 shadow">
            <div class="flex flex-row items-center">
              <div class="flex-shrink pl-1 pr-4">
                <i class="fas fa-user-plus fa-2x fa-fw fa-inverse"></i>
              </div>
              <div class="flex-1 pr-1 text-right">
                <h5 class="text-white">Total occupé</h5>
                <h3 class="text-3xl text-white">
                  {totalAvailable?.length}
                  <span class="text-orange-400">
                    <i class="fas fa-caret-up"></i>
                  </span>
                </h3>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ''
      )}
      <div class="w-full px-3 pt-3 md:w-1/2 md:pr-2 xl:w-1/3 xl:pl-2 xl:pr-3">
        <div class="rounded border bg-gray-500 p-8 shadow">
          <div class="flex flex-row items-center">
            <div class="flex-shrink pl-1 pr-4">
              <i class="fas fa-tasks fa-2x fa-fw fa-inverse"></i>
            </div>
            <div class="flex-1 text-right">
              <h5 class="text-white">Total utilisateur</h5>
              <h3 class="text-3xl text-white">{users?.length}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashbordCard
