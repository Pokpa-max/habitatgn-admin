import { auth, db } from '@/lib/firebase/client_config'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { fetchWithPost } from '../../utils/fetch'

export const userRef = (userId) => doc(db, `users/${userId}`)

export const desableUserFirestore = async (userId, isAvailable) => {
  await updateDoc(userRef(userId), { isAvailable: isAvailable })
}

// Modules délégués à un manager (voir lib/constants/managerModules.js et
// firestore.rules — isAdminOrManager). Sans effet sur un compte admin.
export const updateUserPermissions = async (userId, permissions) => {
  await updateDoc(userRef(userId), { permissions })
}

export const getUserAvailability = async (userId) => {
  if (!userId) return true
  const snap = await getDoc(userRef(userId))
  return snap.exists() ? snap.data().isAvailable !== false : true
}

export const desableUser = async (userId, desableAccount) => {
  try {
    const idToken = await auth.currentUser?.getIdToken()
    fetch('/api/userActivity/desableUser', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(idToken ? { Authorization: idToken } : {}),
      },
      body: JSON.stringify({
        id: userId,
        desableAccount: desableAccount,
      }),
    })
  } catch (error) {
    console.error('error: ', error)
  }
}

export const createAccount = async (data) => {
  const { passWord } = data
  const type = data.userRole?.value || 'manager'

  let name = `${data.firstname || ''} ${data.lastname || ''}`.trim()
  let roleFields = {}

  if (type === 'agent') {
    name = data.fullName
    roleFields = {
      accountType: data.agentAccountType,
      agencyName: data.agentAccountType === 'agence' ? data.agencyName : undefined,
      commune: data.agentCommune,
      propertyTypes: data.propertyTypes || [],
      message: data.message || '',
    }
  } else if (type === 'worker') {
    name = data.fullName
    const specialties =
      data.workerAccountType === 'enterprise'
        ? (data.specialties || []).map((s) => (s === 'autre' ? data.otherSpecialty : s))
        : [data.workerSpecialty === 'autre' ? data.otherSpecialty : data.workerSpecialty].filter(Boolean)
    roleFields = {
      accountType: data.workerAccountType,
      whatsapp: data.whatsapp || '',
      specialties,
      communes: data.communes || [],
      description: data.description || '',
      experienceYears: data.experienceYears ? Number(data.experienceYears) : undefined,
      priceRange: data.priceRange || undefined,
      imageUrl: data.imageUrl || '',
    }
  }

  /*
    The API returns { uid: '...' } confirmed by previous step.
    We construct the object to return to the UI.
  */
  const response = await fetchWithPost('/api/createUser', {
    email: data.email,
    name,
    passWord: passWord,
    phoneNumber: data.phoneNumber,
    agence: data.agence,
    type,
    ...roleFields,
  })

  if (response.code == 0) throw new Error()

  return {
    id: response.uid,
    uid: response.uid,
    email: data.email,
    name,
    firstname: data.firstname,
    lastname: data.lastname,
    phoneNumber: data.phoneNumber,
    agence: data.agence,
    type,
    ...roleFields,
    image_url: '',
    isAvailable: true,
    provider: 'email',
    createdAt: new Date(), // Approximation for UI
  }
}
