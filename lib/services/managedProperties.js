import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

export const managedPropertiesCollectionRef = collection(db, 'managed_properties')

export const managedPropertyDocRef = (id) => doc(db, 'managed_properties', id)

export const getManagedProperties = async () => {
  const q = query(managedPropertiesCollectionRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getPropertiesByOwner = async (ownerId) => {
  if (!ownerId) return []

  const collectionsToSearch = [
    { ref: managedPropertiesCollectionRef, source: 'managed' },
    { ref: collection(db, 'houses'), source: 'houses' },
    { ref: collection(db, 'lands'), source: 'lands' },
    { ref: collection(db, 'daily_rentals'), source: 'daily_rentals' },
  ]

  const fieldsToMatch = ['ownerId', 'userId', 'agentId', 'createdBy']

  const queries = []
  collectionsToSearch.forEach(({ ref }) => {
    fieldsToMatch.forEach((field) => {
      queries.push(
        getDocs(query(ref, where(field, '==', ownerId)))
          .then((snap) => snap.docs)
          .catch(() => [])
      )
    })
  })

  const results = await Promise.all(queries)
  const map = new Map()

  results.flat().forEach((d) => {
    if (!d || !d.id) return
    const data = d.data()

    // Handle type field (can be object { property: 'apartment', transaction: 'rent' })
    let typeStr = 'Immobilier'
    if (typeof data.type === 'string') {
      typeStr = data.type
    } else if (data.type && typeof data.type === 'object') {
      typeStr = data.type.property || data.type.transaction || 'Immobilier'
    } else if (data.category) {
      typeStr = String(data.category)
    }

    // Handle price / rentAmount field (can be object { amount: 7500000, currency: 'GNF' })
    let rentPrice = 0
    if (typeof data.rentAmount === 'number' || typeof data.rentAmount === 'string') {
      rentPrice = Number(data.rentAmount) || 0
    } else if (typeof data.price === 'number' || typeof data.price === 'string') {
      rentPrice = Number(data.price) || 0
    } else if (data.price && typeof data.price === 'object') {
      rentPrice = Number(data.price.amount) || 0
    }

    // Handle location / address field
    let addressStr = '—'
    let cityStr = ''
    if (typeof data.address === 'string' && data.address) {
      addressStr = data.address
      cityStr = data.city || data.commune || ''
    } else if (data.location && typeof data.location === 'object') {
      addressStr = [data.location.neighborhood, data.location.municipality, data.location.landmark]
        .filter(Boolean)
        .join(', ') || '—'
      cityStr = data.location.region || data.commune || ''
    } else if (data.commune) {
      addressStr = data.commune
    }

    // Handle surface / nbRooms from features object
    let surfaceVal = Number(data.surface || 0)
    let nbRoomsVal = Number(data.nbRooms || 0)
    if (data.features && typeof data.features === 'object') {
      if (!surfaceVal && data.features.area) surfaceVal = Number(data.features.area)
      if (!nbRoomsVal && data.features.bedrooms) nbRoomsVal = Number(data.features.bedrooms)
    }

    // Handle main image URL
    const mainImg =
      data.imageUrl ||
      data.features?.imageUrl ||
      data.images?.cover ||
      (Array.isArray(data.imageUrls) ? data.imageUrls[0] : null) ||
      (Array.isArray(data.images?.gallery) ? data.images.gallery[0] : null) ||
      null

    map.set(d.id, {
      ...data,
      id: d.id,
      _collection: d.ref.parent.id,
      imageUrl: mainImg,
      reference: data.reference || data.title || `BIEN-${d.id.slice(-6)}`,
      address: addressStr,
      city: cityStr,
      type: typeStr,
      rentAmount: rentPrice,
      status: data.status === 'available' ? 'vacant' : (data.status || (data.active === false ? 'inactive' : 'vacant')),
      surface: surfaceVal,
      nbRooms: nbRoomsVal,
      commissionRate: Number(data.commissionRate || 0),
      description: data.description || '',
      ownerId: data.ownerId || data.userId || ownerId,
      createdAt: data.createdAt,
    })
  })

  return Array.from(map.values())
}

export const addManagedProperty = async (data) => {
  const payload = { ...data, createdAt: new Date() }
  const docRef = await addDoc(managedPropertiesCollectionRef, payload)
  return { id: docRef.id, _collection: 'managed_properties', ...payload }
}

export const editManagedProperty = async (id, data, collectionName = 'managed_properties') => {
  const targetRef = doc(db, collectionName, id)
  await updateDoc(targetRef, data)
}

export const deleteManagedProperty = async (id, collectionName = 'managed_properties') => {
  const targetRef = doc(db, collectionName, id)
  await deleteDoc(targetRef)
}

const OWNED_COLLECTIONS = ['houses', 'lands', 'daily_rentals', 'managed_properties']
const OWNER_FIELDS = ['ownerId', 'userId', 'agentId', 'createdBy']

const getRawPropertiesForOwner = async (ownerId) => {
  if (!ownerId) return []

  const queries = []
  OWNED_COLLECTIONS.forEach((collName) => {
    const ref = collection(db, collName)
    OWNER_FIELDS.forEach((field) => {
      queries.push(
        getDocs(query(ref, where(field, '==', ownerId)))
          .then((snap) =>
            snap.docs.map((d) => ({ id: d.id, _collection: collName, ...d.data() }))
          )
          .catch(() => [])
      )
    })
  })

  const results = await Promise.all(queries)
  const map = new Map()
  results.flat().forEach((p) => map.set(`${p._collection}/${p.id}`, p))
  return Array.from(map.values())
}

export const deactivatePropertiesForOwner = async (ownerId) => {
  if (!ownerId) return 0

  const properties = await getRawPropertiesForOwner(ownerId)

  const toDeactivate = properties.filter((p) =>
    p._collection === 'managed_properties'
      ? p.status !== 'inactive'
      : (p.status || 'available') === 'available'
  )

  await Promise.all(
    toDeactivate.map((property) => {
      if (property._collection === 'managed_properties') {
        return editManagedProperty(
          property.id,
          { status: 'inactive', suspendedByAdmin: true },
          'managed_properties'
        )
      }
      return editManagedProperty(
        property.id,
        {
          status: 'draft',
          published: false,
          suspendedByAdmin: true,
          statusBeforeSuspension: property.status || 'available',
        },
        property._collection
      )
    })
  )

  return toDeactivate.length
}

export const reactivatePropertiesForOwner = async (ownerId) => {
  if (!ownerId) return 0

  const properties = await getRawPropertiesForOwner(ownerId)
  const toReactivate = properties.filter((p) => p.suspendedByAdmin === true)

  await Promise.all(
    toReactivate.map((property) => {
      if (property._collection === 'managed_properties') {
        return editManagedProperty(
          property.id,
          { status: 'vacant', suspendedByAdmin: false },
          'managed_properties'
        )
      }
      return editManagedProperty(
        property.id,
        {
          status: property.statusBeforeSuspension || 'available',
          published: true,
          suspendedByAdmin: false,
        },
        property._collection
      )
    })
  )

  return toReactivate.length
}
