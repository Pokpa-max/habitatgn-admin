import '../styles/globals.css'
import { ColorProvider } from '../contexts/ColorContext'
import { NotificationsProvider } from '../contexts/NotificationsContext'
import initAuth from '@/utils/firebase/initAuth'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

initAuth()

function MyApp({ Component, pageProps }) {
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
        <NotificationsProvider>
          <Component {...pageProps} />
        </NotificationsProvider>
      </ColorProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default MyApp
