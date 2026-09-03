import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import DashbordCard from '@/components/dashbord/dashbord'
import { useColors } from '@/contexts/ColorContext'
import { useNotifications } from '@/contexts/NotificationsContext'
import { RiSearchLine, RiNotification3Line } from 'react-icons/ri'

import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

// Barre supérieure du Dashboard — reproduit exactement la proposition de
// palette validée : titre "Vue d'ensemble", champ de recherche, icône de
// notification avec pastille. Propre à cette page (pas dans Scaffold),
// à la demande explicite de l'utilisateur.
function DashboardTopbar() {
  const colors = useColors()
  const notifications = useNotifications()
  const hasNotifications = Object.values(notifications).some((count) => count > 0)

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-lg font-extrabold" style={{ color: colors.gray900 }}>
        Vue d&apos;ensemble
      </h1>
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm"
          style={{ borderColor: colors.gray200, backgroundColor: colors.gray50, color: colors.gray500 }}
        >
          <RiSearchLine className="h-3.5 w-3.5 opacity-70" />
          Rechercher…
        </div>
        <div
          className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border"
          style={{ borderColor: colors.gray200 }}
        >
          <RiNotification3Line className="h-4 w-4" style={{ color: colors.gray500 }} />
          {hasNotifications && (
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: colors.orangeAccent }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Home() {
  return (
    <Scaffold>
      <DashboardTopbar />
      <DashbordCard />
    </Scaffold>
  )
}

const HomePage = () => (
  <Page name="Accueil | BâtiMoo Admin">
    <Home />
  </Page>
)

export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthed: AuthAction.REDIRECT_TO_LOGIN,
})(async () => {
  return {
    props: {},
  }
})
export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_LOGIN,
})(HomePage)
