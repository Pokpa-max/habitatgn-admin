import { auth } from '@/lib/firebase/client_config'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
const FOLDER = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER ?? 'servicegn/images'

function extractPublicId(url) {
  if (!url || !url.includes('cloudinary.com')) return null
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/)
  return match ? match[1] : null
}

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

// Redimensionne côté client avant l'upload (jamais d'agrandissement, jamais
// touché aux GIF pour ne pas casser l'animation) — réduit fortement le poids
// stocké sur Cloudinary et livré ensuite, sans dépendre de la config du
// upload preset (les transformations ne sont pas fiables en upload non signé).
// Best-effort : toute erreur retombe sur le fichier original, jamais bloquant.
async function optimizeImageFile(file) {
  if (!file.type?.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale === 1) {
      bitmap.close?.()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export async function uploadToCloudinary(file) {
  const optimized = await optimizeImageFile(file)
  const formData = new FormData()
  formData.append('file', optimized)
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
