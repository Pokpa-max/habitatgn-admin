import { authAdmin } from "@/lib/firebase-admin/admin_config";
import { verifyAdminRequest } from "@/utils/firebase/verifyAdminRequest";
import { logAuditEvent } from "@/lib/firebase-admin/auditLog";



export default async function desableUser(req, res) {

    const caller = await verifyAdminRequest(req);
    if (!caller) {
        return res.status(403).json({ error: "Accès refusé." });
    }

    const { desableAccount, id } = req.body;

    try {
        // Un manager ne peut pas désactiver un compte admin (escalade de
        // privilèges — sinon un manager pourrait verrouiller un admin hors
        // de son compte). Seul un admin peut agir sur un autre admin.
        if (caller.userType !== 'admin') {
            const targetUser = await authAdmin.getUser(id);
            if (targetUser.customClaims?.userType === 'admin') {
                return res.status(403).json({ error: "Accès refusé." });
            }
        }

        await authAdmin.updateUser(id, { disabled: desableAccount });
        await logAuditEvent({
            action: desableAccount ? 'user.disable' : 'user.enable',
            actorUid: caller.uid,
            actorEmail: caller.email,
            actorType: caller.userType,
            targetUid: id,
        });
        res.status(200).json({ message: "Utilisateur desactivé avec succès" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }


}