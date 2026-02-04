import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin, dbAdmin } from 'lib/firebase-admin/admin_config'
import { setCustomUserClaims } from '@/utils/firebase/auth'
import { FieldValue } from 'firebase-admin/firestore'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { email, name, passWord, type, phoneNumber, agence } = req.body

    // 1. Create user in Firebase Auth
    const userRecord = await createUserAuth(email, passWord, name)

    // 2. Determine user type and set custom claims IMMEDIATELY
    const userType = type === 'admin' ? 'admin' : 'manager'
    await setCustomUserClaims(userRecord.uid, userType)

    const { uid } = userRecord
    const batch = dbAdmin.batch()

    // 3. Save to Firestore with new structure and NO password
    batch.set(dbAdmin.collection('users').doc(uid), {
      email,
      name,
      type: userType,
      createdAt: FieldValue.serverTimestamp(),
      phoneNumber: phoneNumber,
      agence: agence,
      image_url: '',
      isAvailable: true,
      provider: 'email',
      uid: uid,
    })

    await batch.commit()

    res.status(200).json({ code: 1, message: 'User created successfully', uid })
  } catch (error: any) {
    console.error('Error creating user:', error)
    // Handle specific error codes if needed, e.g., email already exists
    res.status(500).json({ code: 0, message: error.message || 'Une erreur est survenue' })
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


// import type { NextApiRequest, NextApiResponse } from 'next'
// import { authAdmin, dbAdmin } from 'lib/firebase-admin/admin_config'
// import { setCustomUserClaims } from '@/utils/firebase/auth'
// import { FieldValue } from 'firebase-admin/firestore'

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   try {
//     // 🔹 Autoriser GET et POST
//     if (req.method !== 'GET' && req.method !== 'POST') {
//       return res.status(405).json({ message: 'Method not allowed' })
//     }

//     // 🔹 Récupération depuis query OU body
//     const email = (req.query.email || req.body.email) as string
//     const password = (req.query.password || req.body.passWord) as string
//     const name = (req.query.name || req.body.name || 'Admin') as string
//     const type = (req.query.type || req.body.type || 'manager') as string
//     const phoneNumber = (req.query.phoneNumber || req.body.phoneNumber || '') as string
//     const agence = (req.query.agence || req.body.agence || '') as string

//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email et password requis' })
//     }

//     // 1️⃣ Create user in Firebase Auth
//     const userRecord = await authAdmin.createUser({
//       email,
//       password,
//       displayName: name,
//       emailVerified: false,
//       disabled: false,
//     })

//     // 2️⃣ Set custom claims
//     const userType = type === 'admin' ? 'admin' : 'manager'
//     await setCustomUserClaims(userRecord.uid, userType)

//     // 3️⃣ Save user in Firestore
//     await dbAdmin.collection('users').doc(userRecord.uid).set({
//       uid: userRecord.uid,
//       email,
//       name,
//       type: userType,
//       phoneNumber,
//       agence,
//       image_url: '',
//       isAvailable: true,
//       provider: 'email',
//       createdAt: FieldValue.serverTimestamp(),
//     })

//     return res.status(200).json({
//       code: 1,
//       message: 'User created successfully',
//       uid: userRecord.uid,
//     })
//   } catch (error: any) {
//     console.error(error)
//     return res.status(500).json({
//       code: 0,
//       message: error.message || 'Erreur serveur',
//     })
//   }
// }
