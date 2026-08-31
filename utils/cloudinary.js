import { auth } from '@/lib/firebase/client_config'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
const FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? 'servicegn/images'

function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
  return match ? match[1] : null
}

export async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', FOLDER)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? 'Echec upload image')
  }

  const data = await res.json()
  return data.secure_url
}

export async function deleteFromCloudinary(url) {
  const publicId = extractPublicId(url)
  if (!publicId) return
  try {
    const idToken = await auth.currentUser?.getIdToken()
    await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: idToken } : {}),
      },
      body: JSON.stringify({ publicId }),
    })
  } catch (e) {
    console.error('error', e)
  }
}
