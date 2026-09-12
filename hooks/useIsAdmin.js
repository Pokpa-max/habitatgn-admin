import { useAuthUser } from 'next-firebase-auth'

// Vrai uniquement pour un compte "admin" (pas un manager, même avec toutes
// les permissions) — sert à masquer côté interface les actions les plus
// sensibles (ex: modifier le mot de passe d'un tiers), qui restent de toute
// façon vérifiées "admin only" côté serveur (voir verifyAdminRequest).
export function useIsAdmin() {
  const AuthUser = useAuthUser()
  return AuthUser.claims?.userType === 'admin'
}
