// lib/ordersService.ts
// Handles saving & loading orders and profile in Firebase Firestore.
// Firestore is the SOURCE OF TRUTH for cross-device consistency.
// localStorage is a read-cache only — never the primary store.

import { db } from './firebase'
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

// Timeout helper — longer timeout (10s) so Firestore cold-start / network
// latency doesn't silently discard writes. Never decrease below 8s.
function withTimeout<T>(promise: Promise<T>, ms: number = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firebase operation timed out after ${ms}ms`)), ms)
    ),
  ])
}

// Retry helper: attempt an async operation up to `attempts` times
async function withRetry<T>(fn: () => Promise<T>, attempts = 2, delayMs = 1000): Promise<T> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (i < attempts - 1) {
        console.warn(`[OrdersService] Retry ${i + 1}/${attempts - 1} after error:`, err)
        await new Promise((res) => setTimeout(res, delayMs))
      }
    }
  }
  throw lastErr
}

// ── SAVE ORDER ────────────────────────────────────────────────────────
// Firestore is written FIRST and is the source of truth.
// localStorage is updated as a secondary read-cache.
export async function createOrder(order: Omit<OrderItem, 'id'>): Promise<OrderItem> {
  if (!order.userId) {
    throw new Error('[OrdersService] Cannot create order: userId is empty. Firebase UID required.')
  }

  const generatedId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const fullOrder: OrderItem = {
    ...order,
    id: generatedId,
  }

  // 1. PRIMARY: Save to Firestore with retry — this is the cross-device source of truth
  if (db) {
    await withRetry(
      () =>
        withTimeout(
          addDoc(collection(db!, 'orders'), {
            ...fullOrder,
            serverCreatedAt: serverTimestamp(),
          }),
          10000
        ),
      2, // retry once on failure
      1500
    )
    console.log('[OrdersService] ✅ Order saved to Firestore:', generatedId, '| userId:', order.userId)
  } else {
    throw new Error('[OrdersService] Firestore (db) is not initialised. Order was NOT saved.')
  }

  // 2. SECONDARY: Cache to localStorage so the current session can read instantly
  try {
    const storageKey = `juice_orders_${order.userId}`
    const existing: OrderItem[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const updated = [fullOrder, ...existing.filter((o) => o.id !== fullOrder.id)]
    localStorage.setItem(storageKey, JSON.stringify(updated))
  } catch (err) {
    // Non-fatal — localStorage is just a cache
    console.warn('[OrdersService] localStorage cache write failed (non-fatal):', err)
  }

  return fullOrder
}

// ── GET USER ORDERS ───────────────────────────────────────────────────
// Always queries Firestore by the user's Firebase UID.
// Falls back to localStorage ONLY if Firestore is unreachable.
export async function getUserOrders(userId: string): Promise<OrderItem[]> {
  if (!userId) return []

  // 1. PRIMARY: Fetch from Firestore — source of truth for cross-device consistency
  if (db) {
    try {
      const ordersRef = collection(db, 'orders')
      const q = query(ordersRef, where('userId', '==', userId))
      const snapshot = await withTimeout(getDocs(q), 10000)

      const firestoreOrders: OrderItem[] = []
      snapshot.forEach((docSnap) => {
        firestoreOrders.push(docSnap.data() as OrderItem)
      })

      // Sort newest first
      firestoreOrders.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )

      console.log(
        `[OrdersService] Fetched ${firestoreOrders.length} order(s) from Firestore for userId: ${userId}`
      )

      // Update local cache with fresh Firestore data
      try {
        localStorage.setItem(`juice_orders_${userId}`, JSON.stringify(firestoreOrders))
      } catch (e) {}

      // Return Firestore result (may be empty array — that's correct, not an error)
      return firestoreOrders

    } catch (err) {
      console.error('[OrdersService] ⚠️ Firestore fetch failed, falling back to localStorage:', err)
    }
  }

  // 2. FALLBACK: localStorage if Firestore was unreachable
  try {
    const cached: OrderItem[] = JSON.parse(
      localStorage.getItem(`juice_orders_${userId}`) || '[]'
    )
    console.warn(`[OrdersService] Using ${cached.length} cached order(s) from localStorage (offline fallback)`)
    return cached
  } catch (err) {
    console.error('[OrdersService] localStorage read failed:', err)
    return []
  }
}

// ── USER PROFILE ──────────────────────────────────────────────────────
export async function saveUserProfile(userId: string, data: UserProfileData): Promise<void> {
  if (!userId) return

  // 1. Save to Firestore (source of truth)
  if (db) {
    try {
      const userRef = doc(db, 'users', userId)
      await withTimeout(
        setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true }),
        8000
      )
      console.log('[OrdersService] Profile synced to Firestore for userId:', userId)
    } catch (e) {
      console.warn('[OrdersService] Firestore profile save failed:', e)
    }
  }

  // 2. Update localStorage cache
  try {
    const current = JSON.parse(localStorage.getItem(`juice_profile_${userId}`) || '{}')
    localStorage.setItem(`juice_profile_${userId}`, JSON.stringify({ ...current, ...data }))
  } catch (e) {
    console.warn('[OrdersService] Local profile cache error:', e)
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
      const snap = await withTimeout(getDoc(userRef), 8000)
      if (snap.exists()) {
        const remote = snap.data() as UserProfileData
        // Firestore wins over stale localStorage
        const combined = { ...localProfile, ...remote }
        try {
          localStorage.setItem(`juice_profile_${userId}`, JSON.stringify(combined))
        } catch (e) {}
        return combined
      }
    } catch (e) {
      console.warn('[OrdersService] Firestore profile fetch failed, using local:', e)
    }
  }

  return localProfile
}
