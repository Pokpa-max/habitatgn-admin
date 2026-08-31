import { auth } from '@/lib/firebase/client_config'

export const fetchWithPost = async (url, data) => {
    const idToken = await auth.currentUser?.getIdToken()
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            ...(idToken ? { Authorization: idToken } : {}),
        },
        body: JSON.stringify(data),
    })
    return response.json()
}