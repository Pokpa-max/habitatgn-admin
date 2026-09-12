import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin, dbAdmin } from 'lib/firebase-admin/admin_config'
import { setCustomUserClaims } from '@/utils/firebase/auth'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'
import { FieldValue } from 'firebase-admin/firestore'
import { ALL_MANAGER_MODULE_KEYS, hasManagerAction } from '@/lib/constants/managerModules'
import { logAuditEvent } from '@/lib/firebase-admin/auditLog'

// Même logique que habitatgnweb/src/lib/workerSearchIndex.ts — nécessaire pour que
// les ouvriers créés depuis l'admin soient trouvables dans la recherche libre du
// site public (qui filtre sur workers/{id}.searchIndex.keywords).
const normalizeForSearch = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const buildWorkerSearchIndex = (worker: {
  name?: string
  specialties?: string[]
  communes?: string[]
}) => {
  const name = normalizeForSearch(worker.name)
  const specialties = (worker.specialties || []).map(normalizeForSearch)
  const communes = (worker.communes || []).map(normalizeForSearch)

  const keywords = Array.from(
    new Set(
      [name, ...specialties, ...communes]
        .filter(Boolean)
        .flatMap((term) => term.split(' ').filter((w) => w.length > 1))
    )
  )

  return { keywords }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const caller = await verifyAdminRequest(req)
  if (!caller) {
    return res.status(403).json({ code: 0, message: 'Accès refusé.' })
  }

  try {
    const {
      email,
      name,
      passWord,
      type,
    } = req.body

    if (!email || typeof passWord !== 'string' || passWord.length < 6) {
      return res.status(400).json({
        code: 0,
        message: 'Le mot de passe doit contenir au moins 6 caractères.',
      })
    }

    const {
      phoneNumber,
      agence,
      // Champs spécifiques agent (mêmes noms que agentRequestService.ts côté site public)
      accountType,
      agencyName,
      commune,
      propertyTypes,
      message,
      // Champs spécifiques ouvrier (mêmes noms que workerService.ts côté site public)
      whatsapp,
      specialties,
      communes,
      description,
      experienceYears,
      priceRange,
      imageUrl,
    } = req.body

    const validTypes = ['admin', 'manager', 'agent', 'worker', 'ouvrier']
    let userType = validTypes.includes(type) ? type : 'manager'
    if (userType === 'ouvrier') userType = 'worker'

    // Un manager ne peut jamais créer un compte admin/manager (escalade de
    // privilèges), et ne peut créer un agent/ouvrier que s'il a la
    // permission "process" sur le module correspondant — même contrôle que
    // celui qui masque les boutons "Approuver" côté interface (voir
    // hooks/useCanManage.js), mais appliqué ici côté serveur car cette route
    // passe par l'Admin SDK et ne peut pas être vérifiée par les règles Firestore.
    if (caller.userType !== 'admin') {
      if (userType === 'admin' || userType === 'manager') {
        return res.status(403).json({
          code: 0,
          message: 'Seul un administrateur peut créer ce type de compte.',
        })
      }
      const moduleKey = userType === 'agent' ? 'agents' : 'workers'
      const callerSnap = await dbAdmin.collection('users').doc(caller.uid).get()
      if (!hasManagerAction(callerSnap.data()?.permissions, moduleKey, 'process')) {
        return res.status(403).json({
          code: 0,
          message: "Vous n'avez pas la permission de créer ce type de compte.",
        })
      }
    }

    // 1. Create user in Firebase Auth
    const userRecord = await createUserAuth(email, passWord, name)

    // 2. Set custom claims IMMEDIATELY
    await setCustomUserClaims(userRecord.uid, userType)

    const { uid } = userRecord
    const batch = dbAdmin.batch()

    // 3. Save to Firestore with new structure and NO password
    batch.set(dbAdmin.collection('users').doc(uid), {
      email,
      name,
      type: userType,
      role: userType,
      createdAt: FieldValue.serverTimestamp(),
      phoneNumber: phoneNumber || '',
      agence: agence || '',
      image_url: userType === 'worker' ? imageUrl || '' : '',
      isAvailable: true,
      provider: 'email',
      uid: uid,
      // Tous les modules cochés par défaut : le manager est pleinement
      // fonctionnel dès sa création, un admin peut ensuite le restreindre
      // depuis l'écran "Permissions" (voir components/Users/UsersList.jsx).
      ...(userType === 'manager' ? { permissions: ALL_MANAGER_MODULE_KEYS } : {}),
    })

    // 4. Créé directement par l'admin : mêmes champs qu'une demande soumise depuis le
    // site public (agent_requests / workers), mais déjà "approved". Voir
    // habitatgnweb/src/services/agentRequestService.ts et workerService.ts.
    if (userType === 'agent') {
      batch.set(
        dbAdmin.collection('agent_requests').doc(uid),
        {
          userId: uid,
          accountType: accountType || 'particulier',
          fullName: name,
          agencyName: accountType === 'agence' ? agencyName || '' : '',
          email,
          phone: phoneNumber || '',
          commune: commune || '',
          propertyTypes: Array.isArray(propertyTypes) ? propertyTypes : [],
          message: message || '',
          status: 'approved',
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    } else if (userType === 'worker') {
      const workerSpecialties = Array.isArray(specialties) ? specialties : []
      const workerCommunes = Array.isArray(communes) ? communes : []
      batch.set(
        dbAdmin.collection('workers').doc(uid),
        {
          userId: uid,
          name,
          phone: phoneNumber || '',
          whatsapp: whatsapp || '',
          specialties: workerSpecialties,
          communes: workerCommunes,
          description: description || '',
          experienceYears: experienceYears !== undefined ? Number(experienceYears) : null,
          priceRange: priceRange || '',
          imageUrl: imageUrl || '',
          accountType: accountType || 'individual',
          specialtyCommunePairs: workerSpecialties.flatMap((s: string) =>
            workerCommunes.map((c: string) => `${s}::${c}`)
          ),
          searchIndex: buildWorkerSearchIndex({
            name,
            specialties: workerSpecialties,
            communes: workerCommunes,
          }),
          status: 'approved',
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    await batch.commit()

    await logAuditEvent({
      action: 'user.create',
      actorUid: caller.uid,
      actorEmail: caller.email,
      actorType: caller.userType,
      targetUid: uid,
      targetEmail: email,
      details: { type: userType },
    })

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
