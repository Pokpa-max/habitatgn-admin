import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import ProprietairesTab from '@/components/rentalManagement/ProprietairesTab'

function GestionLocative() {
  return (
    <Scaffold>
      <Header title="Gestion locative" />
      <ProprietairesTab />
    </Scaffold>
  )
}

const GestionLocativePage = () => (
  <Page name="Gestion locative | HabitatGN">
    <GestionLocative />
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
})(GestionLocativePage)
