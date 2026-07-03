import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client_config'

const userCache = new Map()

export function resolveUser(userId) {
  if (!userId) return Promise.resolve(null)
  if (userCache.has(userId)) return Promise.resolve(userCache.get(userId))

  const promise = getDoc(doc(db, 'users', userId))
    .then((snap) => {
      const data = snap.exists() ? snap.data() : null
      const resolved = {
        id: userId,
        name: data?.name || data?.displayName || data?.email || 'Utilisateur',
      }
      userCache.set(userId, resolved)
      return resolved
    })
    .catch(() => {
      const fallback = { id: userId, name: 'Utilisateur' }
      userCache.set(userId, fallback)
      return fallback
    })

  return promise
}

export default function OwnerCell({ userId }) {
  const [name, setName] = useState(() => userCache.get(userId)?.name ?? null)

  useEffect(() => {
    let active = true
    if (!userId) {
      setName('—')
      return
    }
    resolveUser(userId).then((user) => {
      if (active) setName(user?.name || '—')
    })
    return () => {
      active = false
    }
  }, [userId])

  return <span className="text-sm text-gray-700">{name ?? '…'}</span>
}
