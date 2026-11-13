import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import {
  AuthAction,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'
import PartnersTab from '@/components/advertising/PartnersTab'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Partners() {
  return (
    <Scaffold>
      <Header title="Partenaires" />
      <PartnersTab />
    </Scaffold>
  )
}

const PartnersIndexPage = () => (
  <Page name="Partenaires | BâtiMoo Admin">
    <Partners />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'partners'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(PartnersIndexPage)
