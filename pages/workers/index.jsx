import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import {
  AuthAction,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'
import WorkersPage from '@/components/Users/Workers/WorkersPage'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Workers() {
  return (
    <Scaffold>
      <Header title="Ouvriers" />
      <WorkersPage />
    </Scaffold>
  )
}

const WorkersIndexPage = () => (
  <Page name="Ouvriers | BâtiMoo Admin">
    <Workers />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'workers'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(WorkersIndexPage)
