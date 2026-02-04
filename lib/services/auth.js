import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase/client_config'


export const signin = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const token = await userCredential.user.getIdToken()

    // Call login API to verify account status and set cookies
    const res = await fetch('/api/login', {
        headers: { Authorization: token }
    })

    if (!res.ok) {
        const errorData = await res.json()
        await signOut(auth) // Force logout if not allowed
        throw new Error(errorData.error || "Erreur de connexion")
    }
}

export const logout = async () => {
    await signOut(auth)
}
