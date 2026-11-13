import {
  AuthAction,
  withUser,
  withUserTokenSSR,
} from 'next-firebase-auth'

import HomePage from './home'

function Home() {
  return (
    <div>
      <HomePage />
    </div>
  )
}

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!['admin', 'manager'].includes(AuthUser.claims.userType)) {
    return { notFound: true }
  }
  return {
    props: {},
  }
})
export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(Home)
