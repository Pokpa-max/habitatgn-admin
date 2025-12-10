import { authAdmin } from "@/lib/firebase-admin/admin_config";



export default async function desableUser(req, res) {


    const { desableAccount, id } = req.body;

    try {
        await authAdmin.updateUser(id, { disabled: desableAccount });
        res.status(200).json({ message: "Utilisateur desactivé avec succès" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }


}