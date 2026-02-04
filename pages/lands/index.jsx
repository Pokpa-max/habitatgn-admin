import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import {
  AuthAction,
  useAuthUser,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import LandList from '../../components/lands/LandList'
import { useInfiniteLands } from '../../lib/hooks/useLands'
import { useState, useMemo } from 'react'

function Lands() {
  const AuthUser = useAuthUser()
  const [dataLocal, setDataLocal] = useState(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteLands(AuthUser?.claims?.userType, AuthUser?.id)

  const lands = useMemo(() => {
    return data?.pages.flatMap((page) => page.lands) || []
  }, [data])

  return (
    <Scaffold>
      <Header title={'Terrains'} />
      <LandList
        data={dataLocal}
        setData={setDataLocal}
        lands={lands}
        showMore={fetchNextPage}
        hasMore={hasNextPage}
        isLoading={isLoading}
        isFetchingMore={isFetchingNextPage}
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
