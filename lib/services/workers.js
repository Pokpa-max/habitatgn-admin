import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { fetchWithPost } from '@/utils/fetch'
import { notifyAccountStatus, notifySiteUser } from '@/lib/services/accountNotifications'
import { syncWorkerPro } from '@/lib/services/proPlan'

export const workersCollectionRef = collection(db, 'workers')

export const workerDocRef = (id) => doc(db, 'workers', id)

export const getWorkers = async () => {
  const q = query(workersCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getWorkerById = async (id) => {
  const snap = await getDoc(workerDocRef(id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const approveWorker = async (id, userId) => {
  // approvedAt sert de point de départ à la période d'essai de 3 mois avant abonnement payant
  await updateDoc(workerDocRef(id), { status: 'approved', approvedAt: serverTimestamp() })
  if (userId) {
    await setDoc(doc(db, 'users', userId), { role: 'worker', type: 'worker' }, { merge: true })
    try {
      await fetchWithPost('/api/setCustomClaims', {
        uid: userId,
        role: 'worker',
        userType: 'worker',
      })
    } catch (err) {
      console.error('Erreur lors de la mise à jour des custom claims:', err)
    }
  }
  // Période offerte : badge Pro actif jusqu'à sa fin
  await syncWorkerPro(id)
  // L'ouvrier est prévenu sur le site (cloche + push)
  await notifyAccountStatus('worker', id)
}

export const rejectWorker = async (id) => {
  await updateDoc(workerDocRef(id), { status: 'rejected' })
  await notifyAccountStatus('worker', id)
}

// Le site public n'affiche un ouvrier que si son statut est "approved" — rien
// d'autre n'est vérifié (pas de champ isAvailable côté profil ouvrier). Bloquer
// le compte doit donc aussi changer ce statut, sinon le profil reste visible et
// contactable alors que le compte est désactivé.
export const hideWorkerFromPublic = async (id) => {
  const snap = await getDoc(workerDocRef(id))
  if (!snap.exists()) return
  const current = snap.data()
  if (current.status !== 'approved') return
  await updateDoc(workerDocRef(id), {
    status: 'rejected',
    suspendedByAdmin: true,
    statusBeforeSuspension: 'approved',
  })
}

// Contrepartie : ne restaure que si c'est nous qui avions masqué le profil,
// pour ne jamais republier un profil qu'un admin aurait rejeté pour une autre
// raison entre-temps.
export const restoreWorkerVisibility = async (id) => {
  const snap = await getDoc(workerDocRef(id))
  if (!snap.exists()) return
  const current = snap.data()
  if (!current.suspendedByAdmin) return
  await updateDoc(workerDocRef(id), {
    status: current.statusBeforeSuspension || 'approved',
    suspendedByAdmin: false,
  })
}

// Plan payant (free/pro/premium) affiché en badge sur le site public —
// distinct de l'abonnement de référencement de base suivi via worker_payments.
export const updateWorkerPlan = async (id, plan, planExpiresAt) => {
  await updateDoc(workerDocRef(id), { plan, planExpiresAt: planExpiresAt || null })
  await notifySiteUser('worker_plan', { id })
}

// Suspension commerciale de l'abonnement, distincte du blocage du compte.
export const setWorkerSubscriptionSuspended = async (id, suspended) => {
  await updateDoc(workerDocRef(id), {
    subscriptionSuspended: !!suspended,
    subscriptionSuspendedAt: suspended ? serverTimestamp() : null,
  })
}

// Certification par l'administration (badge certifié)
export const toggleWorkerCertification = async (id, isCertified) => {
  await updateDoc(workerDocRef(id), {
    isCertified: !!isCertified,
    certifiedAt: isCertified ? serverTimestamp() : null,
  })
  if (isCertified) await notifySiteUser('worker_certified', { id })
}

// Mise en avant : en tête des listes d'ouvriers du site jusqu'à `boostedUntil`
// (Date), ou retirée avec null.
export const setWorkerBoost = async (id, boostedUntil) => {
  await updateDoc(workerDocRef(id), { boostedUntil: boostedUntil || null })
  if (boostedUntil) await notifySiteUser('worker_boost', { id })
}

// Même règle que habitatgnweb/src/lib/workerSearchIndex.ts et api/createUser :
// la recherche libre du site filtre sur searchIndex.keywords.
const normalizeForSearch = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/**
 * Profil public d'un ouvrier modifié par l'équipe (photo, type, infos,
 * réalisations). L'index de recherche et les couples spécialité/commune du
 * site sont recalculés pour qu'il reste trouvable.
 */
export const updateWorkerProfile = async (id, profile) => {
  const specialties = (profile.specialties || []).map((s) => String(s).trim()).filter(Boolean)
  const communes = (profile.communes || []).map((c) => String(c).trim()).filter(Boolean)
  const keywords = Array.from(
    new Set(
      [normalizeForSearch(profile.name), ...specialties.map(normalizeForSearch), ...communes.map(normalizeForSearch)]
        .filter(Boolean)
        .flatMap((term) => term.split(' ').filter((w) => w.length > 1))
    )
  )
  const changes = {
    name: String(profile.name || '').trim(),
    phone: String(profile.phone || '').trim(),
    whatsapp: String(profile.whatsapp || '').trim(),
    accountType: profile.accountType === 'enterprise' ? 'enterprise' : 'individual',
    specialties,
    communes,
    description: String(profile.description || '').trim(),
    experienceYears: profile.experienceYears === '' || profile.experienceYears == null ? null : Number(profile.experienceYears),
    priceRange: profile.priceRange || '',
    imageUrl: profile.imageUrl || '',
    realizations: (profile.realizations || [])
      .filter((r) => r && r.imageUrl)
      .map((r) => ({ title: String(r.title || '').trim(), imageUrl: r.imageUrl })),
    specialtyCommunePairs: specialties.flatMap((s) => communes.map((c) => `${s}::${c}`)),
    searchIndex: { keywords },
    updatedAt: serverTimestamp(),
  }
  await updateDoc(workerDocRef(id), changes)
  return { ...changes, updatedAt: new Date() }
}

/**
 * Supprime le profil d'un ouvrier SANS compte de connexion (ajout par erreur,
 * doublon, essai). Un ouvrier avec compte se bloque plutôt : supprimer son
 * profil laisserait un compte sans fiche.
 */
export const deleteWorkerProfile = async (worker) => {
  if (worker.userId) throw new Error('Cet ouvrier a un compte : bloquez-le plutôt.')
  await deleteDoc(workerDocRef(worker.id))
}
