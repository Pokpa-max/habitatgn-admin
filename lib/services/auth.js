import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../firebase/client_config'


export const signin = async (email, password) => {
    signInWithEmailAndPassword(auth, email, password)
}

export const logout = async () => {
    await signOut(auth)
}
