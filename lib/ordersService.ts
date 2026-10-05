// lib/ordersService.ts
// Handles saving & loading orders and profile in Firebase Firestore.
// Features auth readiness checks, robust Firestore integration with short 3.5s timeout,
// comprehensive console logging, and local cache fallbacks so purchases never hang.

import { db, auth } from './firebase'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'

export interface OrderItem {
  id: string
  userId: string
  userEmail: string
  items: string
  quantity: number
  unitPrice: number
  totalPrice: number
  currency: string
  status: string
  date: string
  createdAt?: any
  shipping: {
    firstName: string
    lastName: string
    address: string
    city: string
    postalCode: string
  }
  paymentMethod: string
}

export interface UserProfileData {
  displayName?: string
  phoneNumber?: string
  email?: string
  address?: string
  notificationsEnabled?: boolean
  darkMode?: boolean
}

// Timeout helper — 3500ms so operations fail fast instead of freezing the UI
function withTimeout<T>(promise: Promise<T>, ms: number = 3500, label: string = 'Operation'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

// Ensure Firebase Auth is ready before performing user-bound operations
async function ensureAuthReady(): Promise<string | null> {
  if (!auth) return null

  try {
    if (typeof (auth as any).authStateReady === 'function') {
      await withTimeout((auth as any).authStateReady(), 2000, 'Auth readiness check')
    } else {
      if (!auth.currentUser) {
        await new Promise<void>((resolve) => {
          const unsubscribe = auth?.onAuthStateChanged(() => {
            unsubscribe?.()
            resolve()
          })
          setTimeout(resolve, 1500)
        })
      }
    }
  } catch (e) {
    console.warn('[OrdersService] Auth readiness check notice:', e)
  }

  const currentUser = auth.currentUser
  console.log('[OrdersService] 👤 Current Firebase Auth user:', currentUser ? `${currentUser.email} (${currentUser.uid})` : 'None')
  return currentUser?.uid || null
}

// ── SAVE ORDER ────────────────────────────────────────────────────────
export async function createOrder(order: Omit<OrderItem, 'id'>): Promise<OrderItem> {
  console.log('[OrdersService] 🚀 Starting createOrder...')

  // 1. Verify / wait for Firebase Auth readiness
  const verifiedUid = await ensureAuthReady()
  const finalUserId = verifiedUid || order.userId

  if (!finalUserId) {
    console.error('[OrdersService] ❌ Order creation aborted: No user UID found.')
    throw new Error('Please sign in or create an account to complete your purchase.')
  }

  const generatedId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const fullOrder: OrderItem = {
    ...order,
    id: generatedId,
    userId: finalUserId,
  }

  console.log('[OrdersService] 📦 Prepared order:', generatedId, '| User UID:', finalUserId)

  // 2. Save to local cache first so order is immediately secure
  try {
    const storageKey = `juice_orders_${finalUserId}`
    const existing: OrderItem[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const updated = [fullOrder, ...existing.filter((o) => o.id !== fullOrder.id)]
    localStorage.setItem(storageKey, JSON.stringify(updated))
    console.log('[OrdersService] 💾 Cached order locally to storage key:', storageKey)
  } catch (err) {
    console.warn('[OrdersService] Local cache save warning:', err)
  }

  // 3. Attempt to persist to Firestore
  if (db) {
    console.log('[OrdersService] ☁️ Writing order document to Cloud Firestore collection "orders"...')
    const startTime = Date.now()
    try {
      const ordersRef = collection(db, 'orders')
      await withTimeout(
        addDoc(ordersRef, {
          ...fullOrder,
          serverCreatedAt: serverTimestamp(),
        }),
        3500,
        'Firestore order write'
      )
      console.log(`[OrdersService] ✅ Order successfully saved to Firestore in ${Date.now() - startTime}ms! ID:`, generatedId)
    } catch (err: any) {
      console.warn(
        `[OrdersService] ⚠️ Firestore write notice (${Date.now() - startTime}ms):`,
        err?.code || err?.message || err,
        '\nLocal order backup is preserved and purchase will proceed.'
      )
    }
  } else {
    console.warn('[OrdersService] ⚠️ Firestore db instance not available. Order preserved in local cache.')
  }

  return fullOrder
}

// ── GET USER ORDERS ───────────────────────────────────────────────────
export async function getUserOrders(userId: string): Promise<OrderItem[]> {
  if (!userId) return []
  console.log('[OrdersService] 🔍 getUserOrders for userId:', userId)

  // 1. Read from local cache
  let localOrders: OrderItem[] = []
  try {
    const storageKey = `juice_orders_${userId}`
    localOrders = JSON.parse(localStorage.getItem(storageKey) || '[]')
    console.log(`[OrdersService] Found ${localOrders.length} order(s) in local cache`)
  } catch (err) {
    console.warn('[OrdersService] Local cache read warning:', err)
  }

  // 2. Query Cloud Firestore
  if (db) {
    const startTime = Date.now()
    try {
      console.log('[OrdersService] ☁️ Fetching orders from Cloud Firestore...')
      const ordersRef = collection(db, 'orders')
      const q = query(ordersRef, where('userId', '==', userId))
      const snapshot = await withTimeout(getDocs(q), 3500, 'Firestore orders query')

      const firestoreOrders: OrderItem[] = []
      snapshot.forEach((docSnap) => {
        firestoreOrders.push(docSnap.data() as OrderItem)
      })

      console.log(`[OrdersService] ✅ Firestore query completed in ${Date.now() - startTime}ms. Returned ${firestoreOrders.length} document(s).`)

      // Merge Firestore orders with local orders (de-duplicated by ID)
      const mergedMap = new Map<string, OrderItem>()
      firestoreOrders.forEach((o) => mergedMap.set(o.id, o))
      localOrders.forEach((o) => mergedMap.set(o.id, o))

      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      try {
        localStorage.setItem(`juice_orders_${userId}`, JSON.stringify(merged))
      } catch (e) {}

      return merged
    } catch (err: any) {
      console.warn(
        `[OrdersService] ⚠️ Firestore orders query notice (${Date.now() - startTime}ms):`,
        err?.code || err?.message || err,
        '— returning cached orders.'
      )
    }
  }

  return localOrders
}

// ── USER PROFILE ──────────────────────────────────────────────────────
export async function saveUserProfile(userId: string, data: UserProfileData): Promise<void> {
  if (!userId) return

  // 1. Update local cache
  try {
    const current = JSON.parse(localStorage.getItem(`juice_profile_${userId}`) || '{}')
    localStorage.setItem(`juice_profile_${userId}`, JSON.stringify({ ...current, ...data }))
    console.log('[OrdersService] Profile updated in local cache')
  } catch (e) {
    console.warn('[OrdersService] Local profile cache error:', e)
  }

  // 2. Sync to Firestore
  if (db) {
    try {
      const userRef = doc(db, 'users', userId)
      await withTimeout(
        setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true }),
        3500,
        'Firestore profile write'
      )
      console.log('[OrdersService] ✅ Profile synced to Firestore for user:', userId)
    } catch (e: any) {
      console.warn('[OrdersService] ⚠️ Firestore profile sync notice:', e?.code || e?.message || e)
    }
  }
}

export async function getUserProfile(userId: string): Promise<UserProfileData> {
  if (!userId) return {}

  let localProfile: UserProfileData = {}
  try {
    localProfile = JSON.parse(localStorage.getItem(`juice_profile_${userId}`) || '{}')
  } catch (e) {}

  if (db) {
    try {
      const userRef = doc(db, 'users', userId)
      const snap = await withTimeout(getDoc(userRef), 3500, 'Firestore profile read')
      if (snap.exists()) {
        const remote = snap.data() as UserProfileData
        const combined = { ...localProfile, ...remote }
        try {
          localStorage.setItem(`juice_profile_${userId}`, JSON.stringify(combined))
        } catch (e) {}
        return combined
      }
    } catch (e: any) {
      console.warn('[OrdersService] Firestore profile fetch notice:', e?.code || e?.message || e)
    }
  }

  return localProfile
}
