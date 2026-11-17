import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin, dbAdmin } from 'lib/firebase-admin/admin_config'
import { setCustomUserClaims } from '@/utils/firebase/auth'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'
import { FieldValue } from 'firebase-admin/firestore'
import { hasManagerAction } from '@/lib/constants/managerModules'
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

/** Champs publics d'un ouvrier (mêmes noms que workerService.ts côté site public). */
const workerProfileFields = (input: Record<string, any>) => {
  const workerSpecialties: string[] = Array.isArray(input.specialties) ? input.specialties : []
  const workerCommunes: string[] = Array.isArray(input.communes) ? input.communes : []
  return {
    name: input.name || '',
    phone: input.phoneNumber || '',
    whatsapp: input.whatsapp || '',
    specialties: workerSpecialties,
    communes: workerCommunes,
    description: input.description || '',
    experienceYears: input.experienceYears !== undefined && input.experienceYears !== null ? Number(input.experienceYears) : null,
    priceRange: input.priceRange || '',
    imageUrl: input.imageUrl || '',
    accountType: input.accountType || 'individual',
    specialtyCommunePairs: workerSpecialties.flatMap((s) => workerCommunes.map((c) => `${s}::${c}`)),
    searchIndex: buildWorkerSearchIndex({ name: input.name || '', specialties: workerSpecialties, communes: workerCommunes }),
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 0, message: 'Méthode non autorisée.' })
  }

  const caller = await verifyAdminRequest(req)
  if (!caller) {
    return res.status(403).json({ code: 0, message: 'Accès refusé.' })
  }

  let createdUid: string | null = null
  let firestoreCommitted = false

  try {
    const {
      email,
      name,
      passWord,
      type,
      withoutAccount,
    } = req.body || {}

    // Ouvrier ajouté sans compte de connexion : seul son profil public est créé
    const profileOnly = withoutAccount === true && (type === 'worker' || type === 'ouvrier')

    if (
      !profileOnly &&
      (typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof passWord !== 'string' ||
      passWord.length < 6)
    ) {
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
    if (type !== undefined && !validTypes.includes(type)) {
      return res.status(400).json({ code: 0, message: 'Type de compte invalide.' })
    }
    let userType = type || 'manager'
    if (!['admin', 'manager'].includes(caller.userType) && ['admin', 'manager'].includes(userType)) {
      return res.status(403).json({ code: 0, message: 'Seul un administrateur peut créer ce type de compte.' })
    }
    if (userType === 'ouvrier') userType = 'worker'

    // Un manager ne peut jamais créer un compte admin/manager (escalade de
    // privilèges), et ne peut créer un agent/ouvrier que s'il a la
    // permission "process" sur le module correspondant — même contrôle que
    // celui qui masque les boutons "Approuver" côté interface (voir
    // hooks/useCanManage.js), mais appliqué ici côté serveur car cette route
    // passe par l'Admin SDK et ne peut pas être vérifiée par les règles Firestore.
    const callerType = (caller as any).userType || (caller as any).role
    if (callerType !== 'admin') {
      if (userType === 'admin' || userType === 'manager') {
        return res.status(403).json({
          code: 0,
          message: 'Seul un administrateur peut créer ce type de compte.',
        })
      }
      const moduleKey = userType === 'agent' ? 'agents' : 'workers'
      if (!hasManagerAction(caller.permissions, moduleKey, 'process')) {
        return res.status(403).json({
          code: 0,
          message: "Vous n'avez pas la permission de créer ce type de compte.",
        })
      }
    }

    if (profileOnly) {
      if (!String(name || '').trim()) {
        return res.status(400).json({ code: 0, message: "Le nom de l'ouvrier est requis." })
      }
      const workerRef = dbAdmin.collection('workers').doc()
      await workerRef.set({
        ...workerProfileFields({ name, phoneNumber, whatsapp, specialties, communes, description, experienceYears, priceRange, imageUrl, accountType }),
        userId: null,
        // Sans compte : visible sur le site, mais personne ne peut s'y connecter.
        // « Créer son compte » (api/createWorkerAccount) le rattache plus tard.
        hasAccount: false,
        email: typeof email === 'string' ? email.trim() : '',
        status: 'approved',
        createdAt: FieldValue.serverTimestamp(),
      })
      await logAuditEvent({
        action: 'worker.create_profile',
        actorUid: caller.uid,
        actorEmail: caller.email,
        actorType: caller.userType,
        targetUid: workerRef.id,
        targetEmail: typeof email === 'string' ? email : '',
        details: { type: 'worker', withoutAccount: true },
      })
      return res.status(200).json({ code: 1, message: 'Worker profile created', uid: null, workerId: workerRef.id })
    }

    // 1. Create user in Firebase Auth
    const userRecord = await createUserAuth(email, passWord, name || '')
    createdUid = userRecord.uid

    // 2. Set custom claims IMMEDIATELY
    await setCustomUserClaims(userRecord.uid, userType)

    const { uid } = userRecord
    const batch = dbAdmin.batch()

    // 3. Save to Firestore with new structure and NO password
    batch.set(dbAdmin.collection('users').doc(uid), {
      email: email || '',
      name: name || '',
      type: userType,
      role: userType,
      createdAt: FieldValue.serverTimestamp(),
      phoneNumber: phoneNumber || '',
      agence: agence || '',
      image_url: userType === 'worker' ? imageUrl || '' : '',
      isAvailable: true,
      provider: 'email',
      uid: uid,
      // New managers have no access until an admin grants explicit permissions.
      ...(userType === 'manager' ? { permissions: [] } : {}),
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
          fullName: name || '',
          agencyName: accountType === 'agence' ? agencyName || '' : '',
          email: email || '',
          phone: phoneNumber || '',
          commune: commune || '',
          propertyTypes: Array.isArray(propertyTypes) ? propertyTypes : [],
          message: message || '',
          status: 'approved',
          approvedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    } else if (userType === 'worker') {
      batch.set(
        dbAdmin.collection('workers').doc(uid),
        {
          ...workerProfileFields({ name, phoneNumber, whatsapp, specialties, communes, description, experienceYears, priceRange, imageUrl, accountType }),
          userId: uid,
          hasAccount: true,
          status: 'approved',
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }

    await batch.commit()
    firestoreCommitted = true

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
    // Firebase Auth et Firestore ne partagent pas de transaction. Si la
    // création échoue avant l'écriture Firestore, on supprime le compte Auth
    // orphelin afin que l'adresse e-mail puisse être réutilisée.
    if (createdUid && !firestoreCommitted) {
      try {
        await authAdmin.deleteUser(createdUid)
      } catch (cleanupError) {
        console.error('Error cleaning up incomplete user:', cleanupError)
      }
    }
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
