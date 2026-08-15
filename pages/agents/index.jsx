import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import AgentsPage from '@/components/Users/Agents/AgentsPage'

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

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!['admin', 'manager'].includes(AuthUser.claims.userType)) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(AgentsIndexPage)
