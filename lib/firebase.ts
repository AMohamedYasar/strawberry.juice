// lib/firebase.ts
// Firebase client-side configuration for Authentication and Firestore
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const requiredKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey', 'authDomain', 'projectId', 'appId'
]

export function isFirebaseConfigured(): boolean {
  return requiredKeys.every((key) => Boolean(firebaseConfig[key]))
}

let app: FirebaseApp | undefined = undefined
let auth: Auth | undefined = undefined
let db: Firestore | undefined = undefined

if (typeof window !== 'undefined' || isFirebaseConfigured()) {
  if (isFirebaseConfigured()) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    auth = getAuth(app)
    try {
      db = getFirestore(app)
    } catch (e) {
      console.warn('[Firebase] Firestore init notice:', e)
    }
  }
}

export { auth, db }
export default app
