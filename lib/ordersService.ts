// lib/ordersService.ts
// Handles saving & loading orders and profile in Firebase Firestore with reliable local caching and timeouts

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

// Timeout helper so Firestore network hangs never freeze the UI
function withTimeout<T>(promise: Promise<T>, ms: number = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase operation timed out, using local fallback')), ms)
    ),
  ])
}

// ── SAVE ORDER ────────────────────────────────────────────────────────
export async function createOrder(order: Omit<OrderItem, 'id'>): Promise<OrderItem> {
  const generatedId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const fullOrder: OrderItem = {
    ...order,
    id: generatedId,
  }

  // 1. Immediately cache to localStorage so it is 100% saved and available right away
  try {
    const storageKey = `juice_orders_${order.userId}`
    const existing: OrderItem[] = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const updated = [fullOrder, ...existing.filter(o => o.id !== fullOrder.id)]
    localStorage.setItem(storageKey, JSON.stringify(updated))
    console.log('[OrdersService] Cached order locally:', generatedId)
  } catch (err) {
    console.warn('[OrdersService] LocalStorage cache warning:', err)
  }

  // 2. Persist to Firestore with timeout so button never gets stuck
  if (db) {
    try {
      const ordersRef = collection(db, 'orders')
      await withTimeout(
        addDoc(ordersRef, {
          ...fullOrder,
          serverCreatedAt: serverTimestamp(),
        }),
        3000
      )
      console.log('[OrdersService] Saved order to Firestore:', generatedId)
    } catch (err) {
      console.warn('[OrdersService] Firestore save notice (local backup preserved):', err)
    }
  }

  return fullOrder
}

// ── GET USER ORDERS ───────────────────────────────────────────────────
export async function getUserOrders(userId: string): Promise<OrderItem[]> {
  if (!userId) return []

  // 1. Get cached orders first
  let localOrders: OrderItem[] = []
  try {
    const storageKey = `juice_orders_${userId}`
    localOrders = JSON.parse(localStorage.getItem(storageKey) || '[]')
  } catch (err) {
    console.warn('[OrdersService] Error reading local orders:', err)
  }

  // 2. Try fetching from Firestore with timeout
  if (db) {
    try {
      const ordersRef = collection(db, 'orders')
      const q = query(ordersRef, where('userId', '==', userId))
      const snapshot = await withTimeout(getDocs(q), 3000)
      const firestoreOrders: OrderItem[] = []
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as OrderItem
        firestoreOrders.push(data)
      })

      if (firestoreOrders.length > 0) {
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
      }
    } catch (err) {
      console.warn('[OrdersService] Firestore read notice, using local orders:', err)
    }
  }

  return localOrders
}

// ── USER PROFILE ──────────────────────────────────────────────────────
export async function saveUserProfile(userId: string, data: UserProfileData): Promise<void> {
  if (!userId) return

  // 1. Save locally immediately
  try {
    const current = JSON.parse(localStorage.getItem(`juice_profile_${userId}`) || '{}')
    localStorage.setItem(`juice_profile_${userId}`, JSON.stringify({ ...current, ...data }))
  } catch (e) {
    console.warn('[OrdersService] Local profile cache error:', e)
  }

  // 2. Save to Firestore with timeout
  if (db) {
    try {
      const userRef = doc(db, 'users', userId)
      await withTimeout(
        setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true }),
        3000
      )
      console.log('[OrdersService] User profile synced to Firestore')
    } catch (e) {
      console.warn('[OrdersService] Firestore profile save notice (local preserved):', e)
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
      const snap = await withTimeout(getDoc(userRef), 2500)
      if (snap.exists()) {
        const remote = snap.data() as UserProfileData
        const combined = { ...localProfile, ...remote }
        try {
          localStorage.setItem(`juice_profile_${userId}`, JSON.stringify(combined))
        } catch (e) {}
        return combined
      }
    } catch (e) {}
  }

  return localProfile
}
