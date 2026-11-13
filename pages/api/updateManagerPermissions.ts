import type { NextApiRequest, NextApiResponse } from 'next'
import { authAdmin, dbAdmin } from '@/lib/firebase-admin/admin_config'
import { logAuditEvent } from '@/lib/firebase-admin/auditLog'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'
import { MANAGER_MODULES } from '@/lib/constants/managerModules'

const ALLOWED_PERMISSIONS = new Set(
  MANAGER_MODULES.flatMap((module) => [
    module.key,
    ...module.actions.map((action) => `${module.key}:${action}`),
  ])
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 0, message: 'Method not allowed.' })
  }

  const caller = await verifyAdminRequest(req)
  if (!caller || caller.userType !== 'admin') {
    return res.status(403).json({ code: 0, message: 'Accès refusé.' })
  }

  const { uid, permissions } = req.body || {}
  if (
    typeof uid !== 'string' ||
    !uid ||
    !Array.isArray(permissions) ||
    permissions.some((permission) => typeof permission !== 'string' || !ALLOWED_PERMISSIONS.has(permission))
  ) {
    return res.status(400).json({ code: 0, message: 'Invalid permissions or user ID.' })
  }

  const normalizedPermissions = Array.from(new Set(permissions))
  if (
    normalizedPermissions.some((permission) =>
      permission.includes(':') && !normalizedPermissions.includes(permission.split(':')[0])
    )
  ) {
    return res.status(400).json({ code: 0, message: 'Each action must belong to an allowed module.' })
  }

  try {
    const target = await authAdmin.getUser(uid)
    const targetRole = target.customClaims?.userType || target.customClaims?.role
    if (targetRole !== 'manager') {
      return res.status(403).json({ code: 0, message: 'Seuls les comptes manager peuvent recevoir ces permissions.' })
    }

    const userRef = dbAdmin.collection('users').doc(uid)
    const userSnap = await userRef.get()
    if (!userSnap.exists || userSnap.data()?.type !== 'manager') {
      return res.status(404).json({ code: 0, message: 'Manager not found.' })
    }

    await userRef.update({ permissions: normalizedPermissions })
    await logAuditEvent({
      action: 'manager.permissions_update',
      actorUid: caller.uid,
      actorEmail: caller.email,
      actorType: caller.userType,
      targetUid: uid,
      details: { permissionCount: normalizedPermissions.length },
    })

    return res.status(200).json({ code: 1, message: 'Permissions updated.' })
  } catch (error) {
    console.error('Failed to update manager permissions:', error)
    return res.status(500).json({ code: 0, message: 'Unable to update permissions.' })
  }
}
