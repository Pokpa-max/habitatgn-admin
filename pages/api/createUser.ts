import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin, dbAdmin } from 'lib/firebase-admin/admin_config'
import { setCustomUserClaims } from '@/utils/firebase/auth'
import { FieldValue } from 'firebase-admin/firestore'

import { firestoreAutoId } from '../../utils/firebase/firestore'

//TODO: create the default restaurant menu

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { email, name, passWord } = req.body
    const data = req.body

    const userRecord = await createUserAuth(email, passWord, name)

    await setCustomUserClaims(userRecord.uid, 'manager')
    const { uid } = userRecord
    const batch = dbAdmin.batch()

    batch.set(dbAdmin.collection('users').doc(uid), {
      email,
      name,
      type: 'manager',
      passWord,
      createdAt: FieldValue.serverTimestamp(),
    })

    await batch.commit()
    const menuId = firestoreAutoId()

    // await sendEmail(email, name)

    res.status(200).json({ code: 1, message: 'users create successfully' })
  } catch (error) {
    console.log('🤬🤬🤬🤬🤬🤬🤬🤬🤬🤬error', error)
    res.status(500).json({ code: 0, message: 'une erreur est survenu' })
  }
}

const createUserAuth = (
  email: string,
  password: string,
  displayName: string
) => {
  return authAdmin.createUser({
    email,
    emailVerified: false,
    password,
    displayName,
    disabled: false,
  })
}

const verifyUserExit = async (email: string) => {
  try {
    await authAdmin.getUserByEmail(email)
    return true
  } catch (error: any) {
    if (error.code == 'auth/user-not-found') {
      return false
    }
    throw new Error(`errors: ${error.code} `)
  }
}

const sendEmailValidation = async (email: string, name: string) => {
  //TODO: send email validation
  return sendEmail(email, name)
}

const sendEmail = async (email: string, name: string) => {
  //TODO: send email
  return Promise.resolve()
}
