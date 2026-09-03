import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import LeadsPage from '@/components/Leads/LeadsPage'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Leads() {
  return (
    <Scaffold>
      <Header title="Demandes de visite" />
      <LeadsPage />
    </Scaffold>
  )
}

const LeadsIndexPage = () => (
  <Page name="Demandes de visite | BâtiMoo Admin">
    <Leads />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'leads'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(LeadsIndexPage)
