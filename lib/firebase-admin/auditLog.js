import { dbAdmin } from './admin_config'
import { FieldValue } from 'firebase-admin/firestore'

// Historique des actions admin sensibles (création de compte, changement de
// mot de passe, activation/désactivation) — utile pour retracer qui a fait
// quoi en cas de litige ou d'usage abusif d'un accès manager. Ne doit jamais
// faire échouer l'action elle-même si l'écriture du log rate.
/**
 * @param {{
 *   action: string,
 *   actorUid?: string | null,
 *   actorEmail?: string | null,
 *   actorType?: string | null,
 *   targetUid?: string | null,
 *   targetEmail?: string | null,
 *   details?: Record<string, unknown> | null,
 * }} params
 */
export async function logAuditEvent({
  action,
  actorUid = null,
  actorEmail = null,
  actorType = null,
  targetUid = null,
  targetEmail = null,
  details = null,
}) {
  try {
    await dbAdmin.collection('audit_logs').add({
      action,
      actorUid: actorUid || null,
      actorEmail: actorEmail || null,
      actorType: actorType || null,
      targetUid: targetUid || null,
      targetEmail: targetEmail || null,
      details: details || null,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (error) {
    console.error("Erreur lors de la journalisation de l'action:", error)
  }
}
