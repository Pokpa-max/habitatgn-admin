import { addDoc, collection, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

const CATEGORY_TO_COLLECTION: Record<string, string> = {
  houses: 'houses',
  house: 'houses',
  lands: 'lands',
  land: 'lands',
  daily_rentals: 'daily_rentals',
  daily_rental: 'daily_rentals',
}

const COLLECTION_TO_SINGULAR: Record<string, string> = {
  houses: 'house',
  lands: 'land',
  daily_rentals: 'daily_rental',
}

const normalizeCategory = (category?: string) => {
  if (!category) return 'houses'
  const normalized = String(category).trim().toLowerCase()
  return CATEGORY_TO_COLLECTION[normalized] || 'houses'
}

const toSingularCategory = (collectionName: string) =>
  COLLECTION_TO_SINGULAR[collectionName] || 'house'

const buildSearchIndex = (data: Record<string, any> = {}) => {
  const searchableFields = [
    data.title,
    data.reference,
    data.address,
    data.city,
    data.commune,
    data.description,
    data.type,
    data.category,
    data.ownerId,
    data.unitLabel,
  ]

  return searchableFields
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())
    .join(' ')
    .trim()
}

const buildPropertyPayload = (data: Record<string, any>, category: string) => {
  const now = new Date()
  const payload = {
    ...data,
    category: toSingularCategory(category),
    ownerId: data.ownerId || data.userId || '',
    published: data.published !== undefined ? Boolean(data.published) : true,
    verified: data.verified !== undefined ? Boolean(data.verified) : false,
    active: data.active !== undefined ? Boolean(data.active) : true,
    stats: data.stats || { views: 0, favorites: 0 },
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    searchIndex: data.searchIndex || buildSearchIndex(data),
  }

  return payload
}

export const addProperty = async (
  data: Record<string, any>,
  userId?: string
) => {
  const category = normalizeCategory(data.category)
  const payload = buildPropertyPayload(
    { ...data, ownerId: data.ownerId || userId || '' },
    category
  )
  const ref = await addDoc(collection(db, category), payload)
  return { id: ref.id, ...payload }
}

export const updateProperty = async (
  id: string,
  data: Record<string, any>,
  category?: string
) => {
  const targetCategory = normalizeCategory(category)
  const payload: Record<string, any> = {
    ...data,
    category: toSingularCategory(targetCategory),
    updatedAt: new Date(),
  }

  const shouldRefreshSearchIndex = [
    'title',
    'reference',
    'address',
    'city',
    'commune',
    'description',
    'type',
    'category',
    'ownerId',
    'unitLabel',
  ].some((field) => Object.prototype.hasOwnProperty.call(data, field))

  if (shouldRefreshSearchIndex) {
    payload.searchIndex = buildSearchIndex(payload)
  }

  const ref = doc(db, targetCategory, id)
  await updateDoc(ref, payload)
  return { id, ...payload }
}
