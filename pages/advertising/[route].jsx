import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  RiImageLine,
  RiAdvertisementLine,
  RiTeamLine,
} from 'react-icons/ri'
import {
  AuthAction,
  withAuthUser,
  withAuthUserTokenSSR,
} from 'next-firebase-auth'

import Page from '@/components/Page'
import Scaffold from '@/components/Scaffold'
import { useColors } from '@/contexts/ColorContext'
import HeroTab from '@/components/advertising/HeroTab'
import FeaturedAdTab from '@/components/advertising/FeaturedAdTab'
import PartnerAgenciesTab from '@/components/advertising/PartnerAgenciesTab'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Advertising() {
  const colors = useColors()
  const router = useRouter()
  const currentPath = router.query.route

  const subNavigation = [
    {
      name: 'Section héro',
      href: 'hero',
      icon: RiImageLine,
      current: currentPath === 'hero',
      component: <HeroTab />,
    },
    {
      name: 'Bannière vedette',
      href: 'featured-ad',
      icon: RiAdvertisementLine,
      current: currentPath === 'featured-ad',
      component: <FeaturedAdTab />,
    },
    {
      name: 'Agences partenaires',
      href: 'agencies',
      icon: RiTeamLine,
      current: currentPath === 'agencies',
      component: <PartnerAgenciesTab />,
    },
  ]

  const findSlugMatchingCmp = () =>
    subNavigation.find((link) => link.href === currentPath)

  useEffect(() => {
    const foundComponent = findSlugMatchingCmp()
    if (currentPath && !foundComponent) router.push('/404')
  }, [router, currentPath])

  const cmp = findSlugMatchingCmp()?.component

  return (
    <Scaffold
      subNav={
        <>
          <style>{`
            .nav-item-active {
              color: ${colors.primary};
              background-color: transparent;
              font-weight: 700;
              border-left: 3px solid ${colors.primary};
              padding-left: calc(1rem - 3px);
            }

            .nav-item-inactive {
              color: ${colors.gray600};
              transition: all 0.3s ease;
            }

            .nav-item-inactive:hover {
              color: ${colors.primary};
              background-color: ${colors.gray50};
              padding-left: 1rem;
            }
          `}</style>

          <main className="relative min-h-screen">
            <div className="min-h-screen bg-white">
              <div className="divide-y divide-gray-200 lg:grid lg:grid-cols-12 lg:divide-y-0 lg:divide-x">
                <aside className="py-6 lg:col-span-3">
                  <div className="px-6 pb-4">
                    <h1
                      className="text-2xl font-black"
                      style={{ color: colors.gray900 }}
                    >
                      Publicité
                    </h1>
                  </div>
                  <nav className="space-y-1 px-2">
                    {subNavigation.map((item) => (
                      <Link passHref key={item.name} href={item.href}>
                        <a
                          className={classNames(
                            'nav-item-inactive flex items-center gap-3 rounded-lg px-4 py-3',
                            item.current ? 'nav-item-active' : ''
                          )}
                        >
                          <item.icon
                            className="h-5 w-5 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span className="truncate text-sm font-semibold">
                            {item.name}
                          </span>
                        </a>
                      </Link>
                    ))}
                  </nav>
                </aside>
                <div className="px-4 py-6 sm:px-6 lg:col-span-9 lg:px-8">
                  {cmp}
                </div>
              </div>
            </div>
          </main>
        </>
      }
      title="Publicité"
    />
  )
}

const AdvertisingPage = () => (
  <Page name="Publicité | HabitatGN">
    <Advertising />
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
})(AdvertisingPage)
