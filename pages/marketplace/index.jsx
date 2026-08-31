import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import MarketplaceProductsPage from '@/components/Marketplace/MarketplaceProductsPage'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Marketplace() {
  return (
    <Scaffold>
      <Header title="Marketplace & Produits" />
      <MarketplaceProductsPage />
    </Scaffold>
  )
}

const MarketplacePage = () => (
  <Page name="Marketplace | BâtiMoo Admin">
    <Marketplace />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'marketplace'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(MarketplacePage)
