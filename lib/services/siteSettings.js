import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/cloudinary'

// Collection "siteSettings" du site public (habitatgnweb) — documents à ID fixe,
// gardés en phase avec src/services/settingsService.ts de ce dernier.

const siteSettingsDocRef = (id) => doc(db, 'siteSettings', id)

// Contact & réseaux sociaux (doc: contact_info)

export const DEFAULT_CONTACT_SETTINGS = {
  email: '',
  phone1: '',
  phone2: '',
  address1: '',
  address2: '',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  whatsappNumber: '',
}

export const getContactSettings = async () => {
  const snap = await getDoc(siteSettingsDocRef('contact_info'))
  return { ...DEFAULT_CONTACT_SETTINGS, ...(snap.exists() ? snap.data() : {}) }
}

export const updateContactSettings = async (data) => {
  await setDoc(siteSettingsDocRef('contact_info'), data, { merge: true })
}

// Section héro (doc: hero)

export const DEFAULT_HERO_SETTINGS = {
  backgroundImageUrl: '',
}

export const getHeroSettings = async () => {
  const snap = await getDoc(siteSettingsDocRef('hero'))
  return { ...DEFAULT_HERO_SETTINGS, ...(snap.exists() ? snap.data() : {}) }
}

export const updateHeroSettings = async (newImageFile, oldImageUrl) => {
  let backgroundImageUrl = oldImageUrl
  if (newImageFile) {
    backgroundImageUrl = await uploadToCloudinary(newImageFile)
    if (oldImageUrl) {
      deleteFromCloudinary(oldImageUrl)
    }
  }
  await setDoc(siteSettingsDocRef('hero'), { backgroundImageUrl }, { merge: true })
}

// Publicité vedette (doc: featured_ad)

export const DEFAULT_FEATURED_AD_SETTINGS = {
  enabled: false,
  imageUrl: '',
  linkUrl: '/contact',
}

export const getFeaturedAdSettings = async () => {
  const snap = await getDoc(siteSettingsDocRef('featured_ad'))
  return { ...DEFAULT_FEATURED_AD_SETTINGS, ...(snap.exists() ? snap.data() : {}) }
}

export const updateFeaturedAdSettings = async (data, newImageFile, oldImageUrl) => {
  let imageUrl = oldImageUrl
  if (newImageFile) {
    imageUrl = await uploadToCloudinary(newImageFile)
    if (oldImageUrl) {
      deleteFromCloudinary(oldImageUrl)
    }
  }
  await setDoc(siteSettingsDocRef('featured_ad'), { ...data, imageUrl }, { merge: true })
}
