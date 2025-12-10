import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import AdvertisinglsList from '../../components/adverstising/advertisingList'

function Advertising() {
  return (
    <Scaffold>
      <Header title={'Publicité'} />
      <AdvertisinglsList />
    </Scaffold>
  )
}

const AdvertisingPage = () => (
  <Page name="Publicité">
    <Advertising />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (AuthUser.claims.userType !== 'admin') {
    return {
      notFound: true,
    }
  }

  return {
    props: {},
  }
})

export default withAuthUser({
  whenAuthedBeforeRedirect: AuthAction.RENDER,
})(AdvertisingPage)
