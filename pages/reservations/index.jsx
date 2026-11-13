import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import {
  AuthAction,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'
import ReservationsPage from '@/components/Reservations/ReservationsPage'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Reservations() {
  return (
    <Scaffold>
      <ReservationsPage />
    </Scaffold>
  )
}

const ReservationsIndexPage = () => (
  <Page name="Réservations | BâtiMoo Admin">
    <Reservations />
  </Page>
)

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'reservations'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(ReservationsIndexPage)
