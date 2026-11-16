import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { notifySiteUser } from '@/lib/services/accountNotifications'

// Le site public écrit toutes les demandes de service dans une collection unique,
// avec un champ `category` qui distingue le type de demande.
export const serviceRequestsCollectionRef = collection(db, 'service_requests')

// Catégories traitées dans un onglet dédié ; les autres restent des interventions.
export const MAIN_CATEGORIES = [
  'demenagement',
  'gestion-locative',
  'securisation-fonciere',
  'recherche-bien',
]

const toMillis = (value) => {
  if (!value) return 0
  if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate().getTime()
  const d = new Date(value)
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

const sortByCreatedAtDesc = (rows) => [...rows].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))

export const getAllServiceRequests = async () => {
  const snapshot = await getDocs(serviceRequestsCollectionRef)
  return sortByCreatedAtDesc(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
}

export const getServiceRequestsByCategory = async (category) => {
  const all = await getAllServiceRequests()
  return all.filter((r) => r.category === category)
}

// Demandes d'artisan (plomberie, électricité...) ou "autre demande"
export const getArtisanServiceRequests = async () => {
  const all = await getAllServiceRequests()
  return all.filter((r) => !MAIN_CATEGORIES.includes(r.category))
}

/** Suppression définitive (règle Firestore : admin, ou manager « services » avec le droit traiter). */
export const deleteServiceRequest = async (id) => {
  await deleteDoc(doc(db, 'service_requests', id))
}

/**
 * Paiement d'une recherche immobilière payante, noté à la main par l'équipe
 * (rien n'est payé en ligne) : montant, statut, mode et date.
 */
export const updateServiceRequestPayment = async (id, payment) => {
  await updateDoc(doc(db, 'service_requests', id), payment)
}

export const updateServiceRequestStatus = async (id, status) => {
  await updateDoc(doc(db, 'service_requests', id), { status })
  // Le client est prévenu (confirmée / terminée / annulée)
  await notifySiteUser('service_request', { id })
}
