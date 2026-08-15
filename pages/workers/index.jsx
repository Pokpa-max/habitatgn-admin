import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import WorkersPage from '@/components/Users/Workers/WorkersPage'

function Workers() {
  return (
    <Scaffold>
      <WorkersPage />
    </Scaffold>
  )
}

const WorkersIndexPage = () => (
  <Page name="Ouvriers | BâtiMoo Admin">
    <Workers />
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
})(WorkersIndexPage)
