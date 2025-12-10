import { initializeApp, cert, getApps, } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app;


if (!getApps().length) {
    app = initializeApp({
        credential: cert({
            clientEmail: process.env.NEXT_PRIVATE_FIREBASE_CLIENT_EMAIL,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
    });
}


const dbAdmin = getFirestore(app);
const authAdmin = getAuth(app);




export { dbAdmin, authAdmin, };