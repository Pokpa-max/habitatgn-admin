import {
  AuthAction,
  withUser,
  withUserTokenSSR,
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

export const getServerSideProps = withUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async ({ user: AuthUser }) => {
  if (!(await hasManagerModuleAccess(AuthUser.id, AuthUser.claims.userType, 'messages'))) {
    return { notFound: true }
  }
  return { props: {} }
})

export default withUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(MessagesPage)
