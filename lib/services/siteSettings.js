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
  routeSaleContactToBatimoo: true,
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
// `ads` est un tableau de { imageUrl, linkUrl } affiché en carrousel sur le site public.
// `imageUrl`/`linkUrl` sont conservés pour compatibilité avec d'anciens documents à image unique.

export const DEFAULT_FEATURED_AD_SETTINGS = {
  enabled: false,
  imageUrl: '',
  linkUrl: '/contact',
  ads: [],
}

export const getFeaturedAdSettings = async () => {
  const snap = await getDoc(siteSettingsDocRef('featured_ad'))
  const data = { ...DEFAULT_FEATURED_AD_SETTINGS, ...(snap.exists() ? snap.data() : {}) }
  // Migration douce : si un ancien doc n'a qu'une image unique, on la présente comme une entrée d'`ads`.
  if (data.ads.length === 0 && data.imageUrl) {
    data.ads = [{ imageUrl: data.imageUrl, linkUrl: data.linkUrl }]
  }
  return data
}

export const uploadFeaturedAdImage = async (file) => uploadToCloudinary(file)

export const removeFeaturedAdImage = async (imageUrl) => {
  if (imageUrl) deleteFromCloudinary(imageUrl)
}

export const saveFeaturedAdSettings = async ({ enabled, ads }) => {
  const first = ads[0] || { imageUrl: '', linkUrl: '/contact' }
  await setDoc(
    siteSettingsDocRef('featured_ad'),
    { enabled, ads, imageUrl: first.imageUrl, linkUrl: first.linkUrl },
    { merge: true }
  )
}

// Bandeau "Offre de lancement" affiché sur /tarifs (doc: launch_offer)

export const DEFAULT_LAUNCH_OFFER_SETTINGS = {
  enabled: true,
  text: 'Les premiers artisans et agences qui rejoignent BâtiMoo bénéficient de 3 mois gratuits.',
}

export const getLaunchOfferSettings = async () => {
  const snap = await getDoc(siteSettingsDocRef('launch_offer'))
  return { ...DEFAULT_LAUNCH_OFFER_SETTINGS, ...(snap.exists() ? snap.data() : {}) }
}

export const saveLaunchOfferSettings = async ({ enabled, text }) => {
  await setDoc(siteSettingsDocRef('launch_offer'), { enabled, text }, { merge: true })
}
