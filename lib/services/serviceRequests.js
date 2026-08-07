import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

// Le site public écrit toutes les demandes de service dans une collection unique,
// avec un champ `category` qui distingue le type de demande.
export const serviceRequestsCollectionRef = collection(db, 'service_requests')

// Les 3 services immobiliers "principaux" du site public ; tout le reste
// (spécialités artisan, "autre") est une demande d'intervention ponctuelle.
export const MAIN_CATEGORIES = ['demenagement', 'gestion-locative', 'securisation-fonciere']

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

export const updateServiceRequestStatus = async (id, status) => {
  await updateDoc(doc(db, 'service_requests', id), { status })
}
