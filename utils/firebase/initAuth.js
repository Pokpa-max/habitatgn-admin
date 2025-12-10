import { init, } from 'next-firebase-auth'
import { auth } from '../../lib/firebase/client_config'
import { notify } from '../toast'
import { getObjectInString } from '../functionFactory'

const initAuth = () => {
    init({
        authPageURL: '/auth/signin',
        appPageURL: '/',
        loginAPIEndpoint: '/api/login',
        logoutAPIEndpoint: '/api/logout',
        onLoginRequestError: (error) => {
            auth.signOut()
            const errorMessage = error.message
            const convertedError = getObjectInString(errorMessage)
            notify(`Une erreur est survenue, ${convertedError}`, 'error')

        },
        onLogoutRequestError: (error) => {
            console.log('onLogoutRequestError', error)
        },
        // firebaseAuthEmulatorHost: 'localhost:9000',
        firebaseAdminInitConfig: {
            credential: {
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.NEXT_PRIVATE_FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }
        },
        firebaseClientInitConfig: {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,

        },

        cookies: {
            name: 'MadiFood-Admin',
            keys: [
                process.env.COOKIE_SECRET_CURRENT,
                process.env.COOKIE_SECRET_PREVIOUS,
            ],
            maxAge: 12 * 60 * 60 * 24 * 1000, //twelve days
            httpOnly: true,
            overwrite: true,
            path: '/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production' ? true : false,
            signed: true,

        },
        onVerifyTokenError: (error) => {
            console.error('onVerifyTokenError: ', error)
        },
        onTokenRefreshError: (error) => {
            console.error('onVerifyTokenError: ', error)
        }
    })
}

export default initAuth;