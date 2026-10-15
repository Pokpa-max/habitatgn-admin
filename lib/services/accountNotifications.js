import { auth } from '@/lib/firebase/client_config'

// Site public BâtiMoo : c'est lui qui envoie les notifications (cloche + push)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.batimoo.com'

/**
 * Prévient la personne concernée que sa demande de compte agent ou ouvrier a
 * été validée ou refusée. À appeler après l'enregistrement de la décision :
 * le site relit le statut en base. Ne lève jamais d'erreur (la décision de
 * l'admin ne doit pas échouer si la notification ne part pas).
 *
 * @param {'agent' | 'worker'} kind
 * @param {string} id identifiant du document agent_requests / workers
 */
export const notifyAccountStatus = async (kind, id) => {
  try {
    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken || !id) return
    await fetch(`${SITE_URL}/api/notifications/account-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ kind, id }),
    })
  } catch (err) {
    console.error('Erreur notification statut du compte:', err)
  }
}
