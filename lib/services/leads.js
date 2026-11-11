import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { notifySiteUser } from '@/lib/services/accountNotifications'
import { getAgentRequestByUserId } from '@/lib/services/agentRequests'

export const leadsCollectionRef = collection(db, 'leads')

export const getLeads = async () => {
  const q = query(leadsCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const updateLeadStatus = async (id, status) => {
  await updateDoc(doc(db, 'leads', id), { status })
  // Le client (s'il était connecté à l'envoi) est prévenu : prise en charge / clôture
  await notifySiteUser('lead_status', { id })
}

export const deleteLead = async (id) => {
  await deleteDoc(doc(db, 'leads', id))
}

/**
 * Qui a publié l'annonce de chaque demande : agence ou particulier (profil
 * agent ; sans profil agent : BâtiMoo (compte admin / manager) ou particulier.
 * Retourne { [ownerId]: { type: 'agence' | 'particulier' | 'batimoo', name } }.
 */
export const getLeadOwners = async (ownerIds) => {
  const unique = Array.from(new Set((ownerIds || []).filter(Boolean)))
  const entries = await Promise.all(
    unique.map(async (ownerId) => {
      try {
        const profile = await getAgentRequestByUserId(ownerId)
        if (!profile) {
          // Sans profil agent : équipe BâtiMoo (admin / manager) ou simple particulier
          const user = await getDoc(doc(db, 'users', ownerId)).then((snap) => snap.data() || {}).catch(() => ({}))
          const role = user.userType || user.role
          if (role === 'admin' || role === 'manager') return [ownerId, { type: 'batimoo', name: 'BâtiMoo' }]
          const name = user.displayName || user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ')
          return [ownerId, { type: 'particulier', name }]
        }
        const isAgency = profile.accountType === 'agence'
        return [
          ownerId,
          {
            type: isAgency ? 'agence' : 'particulier',
            name: (isAgency ? profile.agencyName : profile.fullName) || profile.fullName || '',
          },
        ]
      } catch (e) {
        return [ownerId, null]
      }
    })
  )
  return Object.fromEntries(entries)
}
