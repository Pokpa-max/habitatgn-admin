import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

import { parseDocsData } from '@/utils/firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import {
  AuthAction,
  useAuthUser,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore'
import { useEffect } from 'react'
import { useState } from 'react'
import { HITS_PER_PAGE } from '../../lib/constants'
import HousesList from '../../components/houses/HouseList'

function Houses() {
  const AuthUser = useAuthUser()
  const [data, setData] = useState(null)

  const [pagination, setPagination] = useState({
    page: 0,
    nbHits: 0,
    showPagination: true,
  })
  const [isLoadingP, setIsLoadingP] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // information id

  useEffect(() => {
    const fetchData = async () => {
      const housesRef = collection(db, 'houses')
      setIsLoading(true)
      // const q = query(
      //   housesRef,
      //   orderBy('createdAt', 'desc'),
      //   limit(HITS_PER_PAGE)
      // )
      const q =
        AuthUser.claims.userType == 'manager'
          ? query(
              housesRef,
              orderBy('createdAt', 'desc'),
              where('userId', '==', AuthUser.id),
              limit(HITS_PER_PAGE)
            )
          : query(housesRef, orderBy('createdAt', 'desc'), limit(HITS_PER_PAGE))

      const querySnapshot = await getDocs(q)
      const houses = parseDocsData(querySnapshot)
      setData({
        houses,
        lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
      })
      setIsLoading(false)
    }
    fetchData()
  }, [])
  const housesToShow = data?.houses ?? []

  const showMoreFirestore = async () => {
    const housesRef = collection(db, 'houses')
    setIsLoadingP(true)
    const lastElement = data.lastElement

    const q =
      AuthUser.claims.userType == 'admin'
        ? query(
            housesRef,
            orderBy('createdAt', 'desc'),
            startAfter(lastElement),
            limit(HITS_PER_PAGE)
          )
        : query(
            housesRef,
            orderBy('createdAt', 'desc'),
            where('userId', '==', AuthUser.id),
            startAfter(lastElement),
            limit(HITS_PER_PAGE)
          )

    // const q =
    //   AuthUser.claims.userType == 'manager'
    //     ? query(
    //         housesRef,
    //         orderBy('createdAt', 'desc'),
    //         where('userId', '==', AuthUser.id),
    //         startAfter(lastElement),
    //         limit(HITS_PER_PAGE)
    //       )
    //     : query(housesRef, orderBy('createdAt', 'desc'), limit(HITS_PER_PAGE))
    const querySnapshot = await getDocs(q)
    const houses = parseDocsData(querySnapshot)
    const nextData = {
      houses: [...data.houses, ...houses],
      lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
    }

    setPagination({ ...pagination, showPagination: houses.length > 0 })

    setData(nextData)
    setIsLoadingP(false)
  }
  return (
    <Scaffold>
      <Header title={'Logement'} />
      <HousesList
        data={data}
        setData={setData}
        houses={housesToShow}
        showMore={showMoreFirestore}
        pagination={pagination.showPagination}
        isLoading={isLoading}
        isLoadingP={isLoadingP}
      />
    </Scaffold>
  )
}

const HousesPage = () => (
  <Page name="ConaLoge Admin | Maisons">
    <Houses />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  return {
    props: {},
  }
})
export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(HousesPage)
