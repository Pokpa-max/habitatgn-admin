import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
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

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'partners'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(PartnersIndexPage)
