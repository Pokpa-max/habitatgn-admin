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

import HousesList from '../../components/houses/HouseList'
import { useInfiniteHouses } from '../../lib/hooks/useHouses'

function Houses() {
  const AuthUser = useAuthUser()
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteHouses(AuthUser?.claims?.userType, AuthUser?.id)

  const houses = data?.pages.flatMap((page) => page.houses) || []

  return (
    <Scaffold>
      <Header title={'Logement'} />
      <HousesList
        houses={houses}
        showMore={fetchNextPage}
        hasMore={hasNextPage}
        isLoading={isLoading}
        isFetchingMore={isFetchingNextPage}
        // Passing data/setData is no longer the React Query way, 
        // but keeping it null/noop for now until we refactor HousesList
        data={{ houses }} 
        setData={() => {}} 
        pagination={hasNextPage}
        isLoadingP={isFetchingNextPage}
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
