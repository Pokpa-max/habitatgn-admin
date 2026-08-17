import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import CareersPage from '@/components/Careers/CareersPage'

function Careers() {
  return (
    <Scaffold>
      <CareersPage />
    </Scaffold>
  )
}

const CareersIndexPage = () => (
  <Page name="Carrières | BâtiMoo Admin">
    <Careers />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (AuthUser.claims.userType !== 'admin') {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(CareersIndexPage)
