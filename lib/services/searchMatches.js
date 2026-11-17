import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

/**
 * Biens du site qui correspondent à une recherche confiée : même projet
 * (louer / acheter), type de bien, zone, chambres et budget.
 * Annonces publiées et disponibles uniquement (houses + lands).
 */

const SITE_URL = 'https://www.batimoo.com'

// « Kipé », « kipe », « KIPÉ » -> « kipe » : comparaison sans accents ni casse
const norm = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const readType = (item) => item.type?.property || item.houseType?.value || ''
const readTransaction = (item) => item.type?.transaction || item.offerType?.value || ''
const readPlace = (item) =>
  [item.location?.neighborhood, item.location?.municipality || item.address?.commune?.label, item.location?.region || item.address?.town?.label]
    .filter(Boolean)
const readPrice = (item) => Number(item.price?.amount ?? item.price ?? 0) || 0
const readBedrooms = (item) => Number(item.features?.bedrooms ?? item.bedrooms ?? 0) || 0

const isOnline = (item) =>
  item.published !== false && item.isAvailable !== false && (!item.status || item.status === 'available')

/** Référence courte affichée sur le site (« BM-3F9K2A ») */
export const listingRef = (id) => {
  const clean = String(id || '').replace(/[^a-z0-9]/gi, '')
  return clean ? `BM-${clean.slice(0, 6).toUpperCase()}` : ''
}

const TYPE_LABELS = {
  apartment: 'Appartement',
  house: 'Maison',
  villa: 'Villa',
  studio: 'Studio',
  duplex: 'Duplex',
  commercial: 'Local commercial',
  land: 'Terrain',
}

const PERIODS = { monthly: ' / mois', yearly: ' / an', nightly: ' / nuit' }

/** Fiche courte d'une annonce pour l'admin et le message WhatsApp. */
const toMatch = (item, collectionName, zones) => {
  const place = readPlace(item)
  const type = readType(item) || (collectionName === 'lands' ? 'land' : '')
  const bedrooms = readBedrooms(item)
  const title =
    item.title ||
    [TYPE_LABELS[type] || 'Bien', bedrooms ? `${bedrooms} chambre${bedrooms > 1 ? 's' : ''}` : null].filter(Boolean).join(' ')
  const zoneMatch = zones.length === 0 || zones.some((zone) => place.some((p) => norm(p).includes(norm(zone)) || norm(zone).includes(norm(p))))
  const price = readPrice(item)
  return {
    id: item.id,
    collection: collectionName,
    title,
    place: place.slice(0, 2).join(', '),
    price,
    priceLabel: price > 0 ? `${price.toLocaleString('fr-FR').replace(/[  ]/g, ' ')} GNF${PERIODS[item.price?.period] || ''}` : 'Prix sur demande',
    image: item.images?.cover || item.imageUrl || item.images?.gallery?.[0] || '',
    ref: listingRef(item.id),
    url: `${SITE_URL}/${collectionName === 'lands' ? 'lands' : 'properties'}/${item.id}`,
    zoneMatch,
  }
}

export async function getMatchingListings(request) {
  const types = Array.isArray(request.propertyTypes) ? request.propertyTypes : []
  const wantsLand = types.includes('land')
  const wantsBuildings = types.length === 0 || types.some((t) => t !== 'land')
  const zones = Array.isArray(request.preferredLocations) ? request.preferredLocations : []
  const maxPrice = Number(request.maxPrice) || 0
  const minBedrooms = Number(request.bedrooms) || 0
  const transactions = request.searchType === 'buy' ? ['sale'] : ['rent', 'bail']

  const sources = []
  if (wantsBuildings) sources.push('houses')
  if (wantsLand) sources.push('lands')

  const snapshots = await Promise.all(
    sources.map((name) => getDocs(query(collection(db, name), where('status', '==', 'available'))))
  )

  const matches = []
  snapshots.forEach((snapshot, index) => {
    const name = sources[index]
    snapshot.docs.forEach((doc) => {
      const item = { id: doc.id, ...doc.data() }
      if (!isOnline(item)) return
      const transaction = readTransaction(item)
      // Les terrains sont à vendre : pas de filtre de transaction pour eux
      if (name === 'houses' && transaction && !transactions.includes(transaction)) return
      const type = readType(item)
      if (name === 'houses' && types.length && type && !types.includes(type)) return
      const price = readPrice(item)
      if (maxPrice && price > maxPrice) return
      if (minBedrooms && name === 'houses' && readBedrooms(item) && readBedrooms(item) < minBedrooms) return
      matches.push(toMatch(item, name, zones))
    })
  })

  // Dans la zone d'abord, puis du plus proche du budget au moins cher
  return matches.sort((a, b) => Number(b.zoneMatch) - Number(a.zoneMatch) || b.price - a.price)
}
