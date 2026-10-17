import {
  AuthAction,
  withUser,
  withUserTokenSSR,
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

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'leads'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(LeadsIndexPage)
