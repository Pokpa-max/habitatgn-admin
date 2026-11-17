import { AuthAction, withUser, withUserTokenSSR } from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import PropertySearchTab from '@/components/services/PropertySearchTab'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

/**
 * Recherches confiées : un seul endroit pour traiter les demandes « Confiez-nous
 * votre recherche » (site, appel, WhatsApp) — contact, paiement, biens à
 * proposer, note du dossier.
 */
function Recherches() {
  return (
    <Scaffold>
      <Header title="Recherches confiées" />
      <PropertySearchTab />
    </Scaffold>
  )
}

const RecherchesPage = () => (
  <Page name="Recherches confiées | BâtiMoo Admin">
    <Recherches />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'services'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(RecherchesPage)
