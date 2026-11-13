import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import {
  AuthAction,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'
import AgentsPage from '@/components/Users/Agents/AgentsPage'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Agents() {
  return (
    <Scaffold>
      <AgentsPage />
    </Scaffold>
  )
}

const AgentsIndexPage = () => (
  <Page name="Agents | BâtiMoo Admin">
    <Agents />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'agents'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(AgentsIndexPage)
