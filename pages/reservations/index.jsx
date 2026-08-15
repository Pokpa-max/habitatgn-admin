import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'
import ReservationsPage from '@/components/Reservations/ReservationsPage'

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

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!['admin', 'manager'].includes(AuthUser.claims.userType)) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(ReservationsIndexPage)
