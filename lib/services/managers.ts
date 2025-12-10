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
  const response = await fetchWithPost('/api/createUser', {
    email: data.email,
    name,
    passWord: passWord,
  })

  if (response.code == 0) throw new Error()
}
