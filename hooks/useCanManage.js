import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useAuthUser } from 'next-firebase-auth'
import { db } from '@/lib/firebase/client_config'
import { hasManagerAction } from '@/lib/constants/managerModules'

// Est-ce que l'utilisateur courant peut faire `action` dans `module` ?
// Un admin peut toujours tout faire. Un manager dépend de son champ
// `permissions` (voir hasManagerAction). Purement côté interface — sert à
// masquer les boutons, pas à sécuriser l'accès aux données (déjà fait par
// les règles Firestore + la garde SSR au niveau du module entier).
export function useCanManage(moduleKey, action) {
  const AuthUser = useAuthUser()
  const userType = AuthUser.claims?.userType
  const [permissions, setPermissions] = useState(undefined) // undefined = pas encore chargé

  useEffect(() => {
    if (userType !== 'manager' || !AuthUser.id) return
    let cancelled = false
    getDoc(doc(db, 'users', AuthUser.id))
      .then((snap) => {
        if (!cancelled) setPermissions(snap.data()?.permissions ?? null)
      })
      .catch(() => {
        if (!cancelled) setPermissions(null)
      })
    return () => {
      cancelled = true
    }
  }, [userType, AuthUser.id])

  if (userType === 'admin') return true
  if (userType !== 'manager') return false
  if (permissions === undefined) return false // ne pas flasher le bouton avant de savoir
  return hasManagerAction(permissions, moduleKey, action)
}
