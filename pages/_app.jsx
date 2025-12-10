import '../styles/globals.css'
import { ColorProvider } from '../contexts/ColorContext'
import initAuth from '@/utils/firebase/initAuth'

initAuth()

function MyApp({ Component, pageProps }) {
  return (
    <ColorProvider>
      <Component {...pageProps} />
    </ColorProvider>
  )
}

export default MyApp
