import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import WorkersPage from '@/components/Users/Workers/WorkersPage'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

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
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'workers'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(WorkersIndexPage)
