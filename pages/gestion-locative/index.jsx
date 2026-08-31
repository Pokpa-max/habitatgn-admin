import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import ProprietairesTab from '@/components/rentalManagement/ProprietairesTab'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function GestionLocative() {
  return (
    <Scaffold>
      <Header title="Gestion locative" />
      <ProprietairesTab />
    </Scaffold>
  )
}

const GestionLocativePage = () => (
  <Page name="Gestion locative | BâtiMoo Admin">
    <GestionLocative />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'properties'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(GestionLocativePage)
