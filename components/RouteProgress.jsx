import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useColors } from '@/contexts/ColorContext'

/**
 * Changement de page de l'admin.
 *
 * 1. Barre de chargement en haut : chaque page vérifie la connexion et les
 *    droits côté serveur avant de s'afficher (parfois plusieurs secondes sur
 *    Vercel). Sans signe visuel, le clic semblait ignoré, on recliquait et la
 *    navigation repartait de zéro.
 * 2. Filet de sécurité : Headless UI 1.6 (menu mobile, fenêtres) peut laisser
 *    `overflow: hidden`, `inert` ou `aria-hidden` sur la page si elle change
 *    pendant qu'une fenêtre se ferme : plus aucun clic ne marchait jusqu'au
 *    rechargement. Après chaque navigation, sans fenêtre ouverte, on retire
 *    ces verrous.
 */
function releaseStaleLocks() {
  if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
  const html = document.documentElement
  html.style.overflow = ''
  html.style.paddingRight = ''
  document.body.style.overflow = ''
  document.body.style.pointerEvents = ''
  document.querySelectorAll('body > [inert], body > [aria-hidden="true"]').forEach((el) => {
    el.removeAttribute('inert')
    if (el.id === '__next') el.removeAttribute('aria-hidden')
  })
  const root = document.getElementById('__next')
  if (root) {
    root.removeAttribute('inert')
    root.removeAttribute('aria-hidden')
  }
}

export default function RouteProgress() {
  const router = useRouter()
  const colors = useColors()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let showTimer
    const start = (url, { shallow } = {}) => {
      if (shallow) return
      // Navigation rapide : pas de barre qui clignote
      clearTimeout(showTimer)
      showTimer = setTimeout(() => setLoading(true), 120)
    }
    const done = () => {
      clearTimeout(showTimer)
      setLoading(false)
      // Après le rendu de la nouvelle page
      requestAnimationFrame(releaseStaleLocks)
    }
    router.events.on('routeChangeStart', start)
    router.events.on('routeChangeComplete', done)
    router.events.on('routeChangeError', done)
    return () => {
      clearTimeout(showTimer)
      router.events.off('routeChangeStart', start)
      router.events.off('routeChangeComplete', done)
      router.events.off('routeChangeError', done)
    }
  }, [router.events])

  if (!loading) return null
  return (
    <div role="progressbar" aria-label="Chargement de la page" className="fixed inset-x-0 top-0 z-[10000] h-[3px] overflow-hidden bg-transparent">
      <style>{`
        @keyframes admin-route-progress {
          0% { transform: translateX(-100%); }
          60% { transform: translateX(-15%); }
          100% { transform: translateX(-5%); }
        }
      `}</style>
      <div
        className="h-full w-full"
        style={{ backgroundColor: colors.orangeAccent, animation: 'admin-route-progress 8s cubic-bezier(0.1, 0.7, 0.2, 1) forwards' }}
      />
    </div>
  )
}
