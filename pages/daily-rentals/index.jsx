import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import {
  AuthAction,
  useAuthUser,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase/client_config'
import { HITS_PER_PAGE } from '../../lib/constants'
import { parseDocsData } from '@/utils/firebase/firestore'
import DailyRentalList from '../../components/dailyRentals/DailyRentalList'

function DailyRentals() {
  const AuthUser = useAuthUser()
  const [data, setData] = useState(null)

  const [pagination, setPagination] = useState({
    page: 0,
    nbHits: 0,
    showPagination: true,
  })
  const [isLoadingP, setIsLoadingP] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const itemsRef = collection(db, 'daily_rentals')
      setIsLoading(true)
      const q =
        AuthUser.claims.userType == 'manager'
          ? query(
              itemsRef,
              orderBy('createdAt', 'desc'),
              where('userId', '==', AuthUser.id),
              limit(HITS_PER_PAGE)
            )
          : query(itemsRef, orderBy('createdAt', 'desc'), limit(HITS_PER_PAGE))

      const querySnapshot = await getDocs(q)
      const items = parseDocsData(querySnapshot)
      setData({
        dailyRentals: items,
        lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
      })
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const itemsToShow = data?.dailyRentals ?? []

  const showMoreFirestore = async () => {
    const itemsRef = collection(db, 'daily_rentals')
    setIsLoadingP(true)
    const lastElement = data.lastElement

    const q =
      AuthUser.claims.userType == 'admin'
        ? query(
            itemsRef,
            orderBy('createdAt', 'desc'),
            startAfter(lastElement),
            limit(HITS_PER_PAGE)
          )
        : query(
            itemsRef,
            orderBy('createdAt', 'desc'),
            where('userId', '==', AuthUser.id),
            startAfter(lastElement),
            limit(HITS_PER_PAGE)
          )

    const querySnapshot = await getDocs(q)
    const items = parseDocsData(querySnapshot)
    const nextData = {
      dailyRentals: [...data.dailyRentals, ...items],
      lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
    }

    setPagination({ ...pagination, showPagination: items.length > 0 })

    setData(nextData)
    setIsLoadingP(false)
  }

  return (
    <Scaffold>
      <Header title={'Location Journalière'} />
      <DailyRentalList
        data={data}
        setData={setData}
        dailyRentals={itemsToShow}
        showMore={showMoreFirestore}
        pagination={pagination.showPagination}
        isLoading={isLoading}
        isLoadingP={isLoadingP}
      />
    </Scaffold>
  )
}

const DailyRentalsPage = () => (
  <Page name="ConaLoge Admin | Locations Journalières">
    <DailyRentals />
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
})(DailyRentalsPage)
