import crypto from 'crypto'
import { verifyAdminRequest } from '@/utils/firebase/verifyAdminRequest'

const ALLOWED_FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? 'servicegn/'

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const caller = await verifyAdminRequest(req)
  if (!caller) {
    return res.status(403).json({ error: 'Accès refusé.' })
  }

  const { publicId } = req.body || {}

  if (!publicId || typeof publicId !== 'string') {
    return res.status(400).json({ error: 'publicId requis' })
  }

  if (!publicId.startsWith(ALLOWED_FOLDER)) {
    return res.status(403).json({ error: 'Suppression non autorisée' })
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const apiKey = process.env.CLOUDINARY_API_KEY
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  const timestamp = Math.round(Date.now() / 1000)
  const signature = crypto
    .createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex')

  const formData = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: apiKey,
    signature,
  })

  const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    body: formData,
  })

  const data = await cloudinaryRes.json()
  return res.status(200).json(data)
}

export default handler
