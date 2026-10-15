import { useEffect, useState } from 'react'
import { RiNotification3Line, RiCloseLine } from 'react-icons/ri'
import { auth } from '@/lib/firebase/client_config'
import { useColors } from '@/contexts/ColorContext'
import { notify } from '@/utils/toast'

// Les abonnements sont enregistrés par le site public, qui envoie les
// notifications (habitatgnweb : /api/push/*, lib/push).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.batimoo.com'
const SW_URL = '/admin-sw.js'
const DISMISS_KEY = 'batimoo_admin_alerts_dismissed_at'
const DISMISS_DAYS = 7

const supported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const dismissedRecently = () => {
  try {
    return Date.now() - Number(localStorage.getItem(DISMISS_KEY) || 0) < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

const toUint8Array = (base64) => {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(window.atob(padded), (c) => c.charCodeAt(0))
}

/**
 * Bandeau « Activez les alertes » : notifications de l'ordinateur ou du
 * téléphone pour les nouvelles demandes, même quand l'admin est fermée.
 * Affiché tant que ce n'est pas activé sur cet appareil.
 */
export default function PushAlertsBanner() {
  const colors = useColors()
  // loading | off | denied | on | hidden
  const [state, setState] = useState('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supported()) return setState('hidden')
    let cancelled = false
    ;(async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_URL)
        const subscription = await registration.pushManager.getSubscription()
        if (cancelled) return
        if (subscription && Notification.permission === 'granted') setState('on')
        else if (Notification.permission === 'denied') setState(dismissedRecently() ? 'hidden' : 'denied')
        else setState(dismissedRecently() ? 'hidden' : 'off')
      } catch {
        if (!cancelled) setState('hidden')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {}
    setState('hidden')
  }

  const enable = async () => {
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off')
        return
      }
      const registration = await navigator.serviceWorker.ready
      const keyResponse = await fetch(`${SITE_URL}/api/push/public-key`)
      if (!keyResponse.ok) throw new Error('configuration')
      const { publicKey } = await keyResponse.json()
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toUint8Array(publicKey),
      })
      const token = await auth.currentUser?.getIdToken()
      if (!token) throw new Error('auth')
      const response = await fetch(`${SITE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(subscription),
      })
      if (!response.ok) throw new Error('subscription')
      setState('on')
      notify('Alertes activées sur cet appareil', 'success')
    } catch {
      notify("Impossible d'activer les alertes. Réessayez.", 'error')
    } finally {
      setBusy(false)
    }
  }

  if (state !== 'off' && state !== 'denied') return null

  return (
    <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 md:px-8">
      <div
        className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
        style={{ backgroundColor: colors.primaryLight, borderColor: `${colors.primary}33` }}
      >
        <RiNotification3Line className="h-6 w-6 shrink-0" style={{ color: colors.primary }} />
        <div className="min-w-0 flex-1 text-sm">
          {state === 'off' ? (
            <>
              <p className="font-semibold text-gray-900">Activez les alertes sur cet appareil</p>
              <p className="text-gray-600">
                Soyez prévenu des nouvelles demandes de service dès leur arrivée, même quand l&apos;admin est fermée.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-900">Les notifications sont bloquées pour l&apos;admin</p>
              <p className="text-gray-600">
                Cliquez sur le cadenas à gauche de l&apos;adresse admin.batimoo.com → Notifications → Autoriser, puis
                rechargez la page.
              </p>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {state === 'off' && (
            <button
              type="button"
              onClick={enable}
              disabled={busy}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              style={{ backgroundColor: colors.primary }}
            >
              {busy ? 'Activation…' : 'Activer les alertes'}
            </button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-2 text-gray-500 hover:bg-white/60"
            title="Plus tard"
            aria-label="Plus tard"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
