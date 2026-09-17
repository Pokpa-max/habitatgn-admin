import { deleteField, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'
import { uploadToCloudinary, deleteFromCloudinary } from '@/utils/cloudinary'

// Collection "site_settings" du site public (habitatgnweb) — documents à ID fixe,
// gardés en phase avec src/services/settingsService.ts de ce dernier.

const siteSettingsDocRef = (id) => doc(db, 'site_settings', id)

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
  slides: [],
}

export const getHeroSettings = async () => {
  const snap = await getDoc(siteSettingsDocRef('hero'))
  const data = snap.exists() ? snap.data() : {}
  if (Array.isArray(data.slides)) {
    return { ...DEFAULT_HERO_SETTINGS, ...data }
  }

  // Migration douce des données précédentes, afin de ne pas perdre les images
  // déjà enregistrées avant leur prochaine sauvegarde.
  const legacyUrls = [data.backgroundImageUrl, ...(data.imageUrls || [])].filter(Boolean)
  return {
    ...DEFAULT_HERO_SETTINGS,
    ...data,
    slides: legacyUrls.slice(0, 3).map((imageUrl, index) => ({
      imageUrl,
      title: index === 0 ? data.title || '' : '',
    })),
  }
}

export const updateHeroSettings = async (newImageFiles = [], oldSlides = []) => {
  const nextSlides = Array.from({ length: 3 }, (_, index) => ({
    imageUrl: oldSlides[index]?.imageUrl || '',
    title: oldSlides[index]?.title?.trim() || '',
  }))

  for (let index = 0; index < 3; index += 1) {
    const file = newImageFiles[index]
    if (!file) continue

    const oldUrl = nextSlides[index].imageUrl
    nextSlides[index].imageUrl = await uploadToCloudinary(file)
    if (oldUrl) deleteFromCloudinary(oldUrl)
  }

  await setDoc(
    siteSettingsDocRef('hero'),
    {
      slides: nextSlides.filter((slide) => slide.imageUrl),
      // Suppression des anciens champs après migration vers `slides`.
      backgroundImageUrl: deleteField(),
      imageUrls: deleteField(),
      title: deleteField(),
      subtitle: deleteField(),
    },
    { merge: true }
  )
}

// Publicité vedette (doc: featured_ad)
// `enabled`: statut d'activation (true/false)
// `text`: texte personnalisé de la publicité
// `linkUrl`: lien de destination au clic
// `ads`: tableau d'images { imageUrl, linkUrl } pour carrousel
export const DEFAULT_FEATURED_AD_SETTINGS = {
  enabled: false,
  text: '',
  linkUrl: '/contact',
  imageUrl: '',
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

export const saveFeaturedAdSettings = async ({ enabled, text, linkUrl, ads }) => {
  const first = (ads && ads[0]) || { imageUrl: '', linkUrl: linkUrl || '/contact' }
  const finalLinkUrl = linkUrl !== undefined ? linkUrl : first.linkUrl || '/contact'
  await setDoc(
    siteSettingsDocRef('featured_ad'),
    {
      enabled,
      text: text || '',
      linkUrl: finalLinkUrl,
      ads: ads || [],
      imageUrl: first.imageUrl || '',
    },
    { merge: true }
  )
}

// Bandeau "Offre de lancement" (doc: launch_offer)
export const DEFAULT_LAUNCH_OFFER_TEXT =
  'Offre spéciale BâtiMoo : 3 mois offerts pour les premiers artisans et agences !'

export const DEFAULT_LAUNCH_OFFER_SETTINGS = {
  enabled: true,
  text: DEFAULT_LAUNCH_OFFER_TEXT,
}

export const getLaunchOfferSettings = async () => {
  const snap = await getDoc(siteSettingsDocRef('launch_offer'))
  const data = snap.exists() ? snap.data() : {}
  return {
    enabled: data.enabled !== undefined ? data.enabled : true,
    text: data.text !== undefined ? data.text : DEFAULT_LAUNCH_OFFER_TEXT,
  }
}

export const saveLaunchOfferSettings = async ({ enabled, text }) => {
  await setDoc(
    siteSettingsDocRef('launch_offer'),
    {
      enabled: enabled !== undefined ? enabled : true,
      text: text !== undefined ? text : DEFAULT_LAUNCH_OFFER_TEXT,
    },
    { merge: true }
  )
}
