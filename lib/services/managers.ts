import { db } from '@/lib/firebase/client_config'
import { doc, updateDoc } from 'firebase/firestore'
import { fetchWithPost } from '../../utils/fetch'

export const userRef = (userId) => doc(db, `users/${userId}`)

export const desableUserFirestore = async (userId, isAvailable) => {
  await updateDoc(userRef(userId), { isAvailable: isAvailable })
}

export const desableUser = async (userId, desableAccount) => {
  try {
    fetch('/api/userActivity/desableUser', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        id: userId,
        desableAccount: desableAccount,
      }),
    })
  } catch (error) {
    console.log('error: ', error)
  }
}

export const createAccount = async (data) => {
  //creating account

  const { firstname, lastname, passWord } = data
  const name = `${firstname} ${lastname}`
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
    type: data.userRole?.value // Assuming userRole is a select object
  })

  if (response.code == 0) throw new Error()

  return {
    id: response.uid,
    uid: response.uid,
    email: data.email,
    name,
    firstname,
    lastname,
    phoneNumber: data.phoneNumber,
    agence: data.agence,
    type: data.userRole?.value || 'manager',
    image_url: '',
    isAvailable: true,
    provider: 'email',
    createdAt: new Date(), // Approximation for UI
  }
}
