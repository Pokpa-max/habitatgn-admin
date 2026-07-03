import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import ContactTab from '@/components/siteSettings/ContactTab'

function Settings() {
  return (
    <Scaffold>
      <Header title="Paramètres" />
      <ContactTab />
    </Scaffold>
  )
}

const SettingsPage = () => (
  <Page name="Paramètres | HabitatGN">
    <Settings />
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
})(SettingsPage)
