import '../styles/globals.css'
import { ColorProvider } from '../contexts/ColorContext'
import { NotificationsProvider } from '../contexts/NotificationsContext'
import initAuth from '@/utils/firebase/initAuth'
import RouteProgress from '@/components/RouteProgress'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'

initAuth()

function MyApp({ Component, pageProps }) {
  // Service worker dès l'ouverture : l'admin s'installe comme une application
  // sur téléphone (il gère aussi les notifications push)
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/admin-sw.js').catch(() => {})
  }, [])

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ColorProvider>
        <RouteProgress />
        <NotificationsProvider>
          <Component {...pageProps} />
        </NotificationsProvider>
      </ColorProvider>
      <Toaster position="top-right" />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

export default MyApp
