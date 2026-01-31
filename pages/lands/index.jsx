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
import LandList from '../../components/lands/LandList'

function Lands() {
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
      const itemsRef = collection(db, 'lands')
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
        lands: items,
        lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
      })
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const itemsToShow = data?.lands ?? []

  const showMoreFirestore = async () => {
    const itemsRef = collection(db, 'lands')
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
      lands: [...data.lands, ...items],
      lastElement: querySnapshot.docs[querySnapshot.docs.length - 1],
    }

    setPagination({ ...pagination, showPagination: items.length > 0 })

    setData(nextData)
    setIsLoadingP(false)
  }

  return (
    <Scaffold>
      <Header title={'Terrains'} />
      <LandList
        data={data}
        setData={setData}
        lands={itemsToShow}
        showMore={showMoreFirestore}
        pagination={pagination.showPagination}
        isLoading={isLoading}
        isLoadingP={isLoadingP}
      />
    </Scaffold>
  )
}

const LandsPage = () => (
  <Page name="ConaLoge Admin | Terrains">
    <Lands />
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
})(LandsPage)
