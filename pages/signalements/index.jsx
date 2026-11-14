import {
  AuthAction,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import ListingReportsPage from '@/components/Reports/ListingReportsPage'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Signalements() {
  return (
    <Scaffold>
      <Header title="Annonces signalées" />
      <ListingReportsPage />
    </Scaffold>
  )
}

const SignalementsIndexPage = () => (
  <Page name="Annonces signalées | BâtiMoo Admin">
    <Signalements />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'properties'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(SignalementsIndexPage)
