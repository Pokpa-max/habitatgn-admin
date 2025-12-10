import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import DashbordCard from '@/components/dashbord/dashbord'

import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

function Home() {
  return (
    <Scaffold>
      <Header title={'Acceuil'} />
      <DashbordCard />
    </Scaffold>
  )
}

const HomePage = () => (
  <Page name="ConaLoge - Admin">
    <Home />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async () => {
  return {
    props: {},
  }
})
export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(HomePage)
