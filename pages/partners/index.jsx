import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import PartnersTab from '@/components/advertising/PartnersTab'

function Partners() {
  return (
    <Scaffold>
      <Header title="Partenaires" />
      <PartnersTab />
    </Scaffold>
  )
}

const PartnersIndexPage = () => (
  <Page name="Partenaires | BâtiServices Admin">
    <Partners />
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
})(PartnersIndexPage)
