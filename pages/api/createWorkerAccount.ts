import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin, dbAdmin } from 'lib/firebase-admin/admin_config'
import { setCustomUserClaims } from '@/utils/firebase/auth'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'
import { FieldValue } from 'firebase-admin/firestore'
import { hasManagerAction } from '@/lib/constants/managerModules'
import { logAuditEvent } from '@/lib/firebase-admin/auditLog'

/**
 * Crée le compte de connexion d'un ouvrier ajouté sans compte
 * (api/createUser avec withoutAccount) et le rattache à son profil :
 * workers/{workerId}.userId = nouveau compte. Le profil, ses avis et ses
 * paiements gardent le même identifiant.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 0, message: 'Méthode non autorisée.' })
  }

  const caller = await verifyAdminRequest(req)
  if (!caller) {
    return res.status(403).json({ code: 0, message: 'Accès refusé.' })
  }
  const callerType = (caller as any).userType || (caller as any).role
  if (callerType !== 'admin' && !hasManagerAction((caller as any).permissions, 'workers', 'process')) {
    return res.status(403).json({ code: 0, message: "Vous n'avez pas la permission de créer ce compte." })
  }

  const { workerId, email, passWord } = req.body || {}
  if (typeof workerId !== 'string' || !workerId) {
    return res.status(400).json({ code: 0, message: 'Ouvrier introuvable.' })
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ code: 0, message: 'Entrez un email valide.' })
  }
  if (typeof passWord !== 'string' || passWord.length < 6) {
    return res.status(400).json({ code: 0, message: 'Le mot de passe doit contenir au moins 6 caractères.' })
  }

  const workerRef = dbAdmin.collection('workers').doc(workerId)
  const workerSnap = await workerRef.get()
  if (!workerSnap.exists) {
    return res.status(404).json({ code: 0, message: 'Ouvrier introuvable.' })
  }
  const worker = workerSnap.data() || {}
  if (worker.userId) {
    return res.status(409).json({ code: 0, message: 'Cet ouvrier a déjà un compte.' })
  }

  let createdUid: string | null = null
  let committed = false
  try {
    const userRecord = await authAdmin.createUser({
      email: email.trim(),
      emailVerified: false,
      password: passWord,
      displayName: worker.name || '',
      disabled: false,
    })
    createdUid = userRecord.uid
    await setCustomUserClaims(userRecord.uid, 'worker')

    const batch = dbAdmin.batch()
    batch.set(dbAdmin.collection('users').doc(userRecord.uid), {
      email: email.trim(),
      name: worker.name || '',
      type: 'worker',
      role: 'worker',
      createdAt: FieldValue.serverTimestamp(),
      phoneNumber: worker.phone || '',
      agence: '',
      image_url: worker.imageUrl || '',
      isAvailable: true,
      provider: 'email',
      uid: userRecord.uid,
    })
    batch.update(workerRef, {
      userId: userRecord.uid,
      hasAccount: true,
      email: email.trim(),
      accountCreatedAt: FieldValue.serverTimestamp(),
    })
    await batch.commit()
    committed = true

    await logAuditEvent({
      action: 'worker.create_account',
      actorUid: caller.uid,
      actorEmail: caller.email,
      actorType: caller.userType,
      targetUid: userRecord.uid,
      targetEmail: email.trim(),
      details: { workerId },
    })

    return res.status(200).json({ code: 1, uid: userRecord.uid })
  } catch (error: any) {
    // Compte de connexion créé mais profil non rattaché : on le supprime
    // pour que l'email reste utilisable
    if (createdUid && !committed) {
      try {
        await authAdmin.deleteUser(createdUid)
      } catch (cleanupError) {
        console.error('Error cleaning up worker account:', cleanupError)
      }
    }
    const message =
      error?.code === 'auth/email-already-exists'
        ? 'Cet email est déjà utilisé par un autre compte.'
        : error?.message || 'Une erreur est survenue'
    return res.status(500).json({ code: 0, message })
  }
}
