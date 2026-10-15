import { auth } from '@/lib/firebase/client_config'

// Site public BâtiMoo : c'est lui qui envoie les notifications (cloche + push)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.batimoo.com'

/**
 * Prévient l'utilisateur concerné d'une décision prise ici (voir la liste des
 * événements dans habitatgnweb : src/app/api/notifications/admin-event).
 * À appeler APRÈS l'enregistrement : le site relit l'état en base.
 * Ne lève jamais d'erreur : l'action de l'admin ne doit pas échouer si la
 * notification ne part pas.
 *
 * @param {string} event ex. 'account', 'listing_status', 'product_status'...
 * @param {object} payload identifiants utiles (id, collection, kind...)
 */
export const notifySiteUser = async (event, payload = {}) => {
  try {
    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) return
    await fetch(`${SITE_URL}/api/notifications/admin-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ event, ...payload }),
    })
  } catch (err) {
    console.error('Erreur notification utilisateur:', err)
  }
}

/** Demande de compte agent / ouvrier validée ou refusée */
export const notifyAccountStatus = (kind, id) => notifySiteUser('account', { kind, id })
