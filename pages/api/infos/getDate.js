
import { getOnlineDate } from "../../../utils/date";

export default async function handler(req, res) {
    try {
        const date = await getOnlineDate();
        res.status(200).json({ date });
    } catch (error) {
        res.status(500).json(error);
    }
}
