import { authAdmin } from "@/lib/firebase-admin/admin_config";
import { verifyAdminRequest } from "@/utils/firebase/verifyAdminRequest";



export default async function desableUser(req, res) {

    const caller = await verifyAdminRequest(req);
    if (!caller) {
        return res.status(403).json({ error: "Accès refusé." });
    }

    const { desableAccount, id } = req.body;

    try {
        await authAdmin.updateUser(id, { disabled: desableAccount });
        res.status(200).json({ message: "Utilisateur desactivé avec succès" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }


}