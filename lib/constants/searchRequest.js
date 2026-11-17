/**
 * Recherches confiées : mêmes clés que le formulaire du site
 * (habitatgnweb/src/lib/constants/searchRequest.ts) — ne pas les renommer.
 */

export const ANY_ZONE = 'Tous les quartiers'

export const CONAKRY_NEIGHBORHOODS = [
  'Almamya', 'Bambeto', 'Bellevue', 'Bonfi', 'Boulbinet', 'Camayenne', 'Cimenterie',
  'Coléah', 'Concasseur', 'Coronthie', 'Cosa', 'Dabompa', 'Dabondy', 'Dar es Salam',
  'Donka', 'Enco 5', 'Entag', 'Gbessia', 'Hafia', 'Hamdallaye', 'Kagbelen', 'Kakimbo',
  'Kaporo', 'Kassa', 'Kénien', 'Kipé', 'Kissosso', 'Kobaya', 'Koloma', 'Kountia',
  'Lambanyi', 'Lambandji', 'Landréah', 'Lansanaya', 'Madina', 'Manéah', 'Minière',
  'Nongo', 'Sandervalia', 'Sangoyah', 'Sanoyah', 'Simanbossia', 'Simbaya', 'Sonfonia',
  'Tannerie', 'Taouyah', 'Tombo', 'Tombolia', 'Wanindara', 'Yattaya', 'Yimbaya',
]

/**
 * Souhaits du client et comment les reconnaître sur une annonce
 * (`features` chiffrées ou équipements `amenities`).
 */
export const WANTED_FEATURES = [
  { key: 'livingRoom', label: 'Salon', test: (item) => Number(item.features?.livingRooms) > 0 },
  { key: 'ensuite', label: 'Douche interne', test: (item) => Number(item.features?.selfContainedRooms) > 0 },
  { key: 'kitchen', label: 'Cuisine', test: (item) => Number(item.features?.kitchens) > 0 || hasAmenity(item, 'fittedKitchen') },
  { key: 'terrace', label: 'Terrasse / balcon', test: (item) => hasAmenity(item, 'terrace') },
  { key: 'parking', label: 'Parking', test: (item) => hasAmenity(item, 'parking') },
  { key: 'furnished', label: 'Meublé', test: (item) => item.features?.furnished === true },
  { key: 'fenced', label: 'Cour clôturée', test: (item) => hasAmenity(item, 'fenced') },
  { key: 'airConditioning', label: 'Climatisation', test: (item) => hasAmenity(item, 'airConditioning') },
  { key: 'generator', label: 'Groupe électrogène', test: (item) => hasAmenity(item, 'generator') },
  { key: 'borehole', label: 'Forage', test: (item) => hasAmenity(item, 'borehole') },
]

function hasAmenity(item, key) {
  return Array.isArray(item.amenities) && item.amenities.includes(key)
}

export const BEDROOM_OPTIONS = ['1', '2', '3', '4', '5']

/** « 2 ou 3 », « 5 et plus » ; anciennes demandes : « 2 minimum ». */
export function bedroomsText(request) {
  const options = Array.isArray(request.bedroomOptions) ? request.bedroomOptions.map(Number) : []
  if (options.length) {
    const words = [...options].sort((a, b) => a - b).map((n) => (n >= 5 ? '5 et plus' : String(n)))
    if (words.length === 1) return words[0]
    const last = words.pop()
    return `${words.join(', ')} ou ${last}`
  }
  return request.bedrooms ? `${request.bedrooms} minimum` : null
}

export const wantedFeaturesText = (request) =>
  Array.isArray(request.wantedFeatures) && request.wantedFeatures.length
    ? WANTED_FEATURES.filter((f) => request.wantedFeatures.includes(f.key)).map((f) => f.label).join(', ')
    : null
