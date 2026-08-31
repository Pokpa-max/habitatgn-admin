import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import Header from '@/components/Header'
import ContactMessagesPage from '@/components/messages/ContactMessagesPage'
import { hasManagerModuleAccess } from '@/utils/firebase/checkManagerAccess'

function Messages() {
  return (
    <Scaffold>
      <Header title="Messages" />
      <ContactMessagesPage />
    </Scaffold>
  )
}

const MessagesPage = () => (
  <Page name="Messages | BâtiMoo Admin">
    <Messages />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'messages'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(MessagesPage)
