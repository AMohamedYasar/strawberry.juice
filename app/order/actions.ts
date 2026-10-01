'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function processOrder(formData: FormData) {
  // ── Try Supabase session first (for Supabase-auth users) ──────────────
  const supabase = createClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()

  // ── Also accept Firebase UID passed from the client form ──────────────
  // The CheckoutClient sends the Firebase UID as a hidden field.
  const firebaseUserId = (formData.get('firebaseUserId') as string || '').trim()
  const firebaseUserEmail = (formData.get('firebaseUserEmail') as string || '').trim()

  // Determine the effective user
  const userId = supabaseUser?.id || firebaseUserId
  const userEmail = supabaseUser?.email || firebaseUserEmail

  if (!userId) {
    redirect('/login?message=Please sign in before placing an order.')
  }

  // ── Extract form fields ────────────────────────────────────────────────
  const firstName   = (formData.get('firstName')   as string || '').trim()
  const lastName    = (formData.get('lastName')    as string || '').trim()
  const address     = (formData.get('address')     as string || '').trim()
  const city        = (formData.get('city')        as string || '').trim()
  const postalCode  = (formData.get('postalCode')  as string || '').trim()
  const cardNumber  = (formData.get('cardNumber')  as string || '').trim().replace(/\s+/g, '')
  const expiry      = (formData.get('expiry')      as string || '').trim()
  const cvc         = (formData.get('cvc')         as string || '').trim()

  // ── Server-side validation ─────────────────────────────────────────────
  if (!firstName || !lastName || !address || !city || !postalCode) {
    redirect('/error?message=' + encodeURIComponent('Shipping details are incomplete. Please fill in all address fields.'))
  }

  if (!cardNumber || cardNumber.length < 13 || !expiry || !cvc) {
    redirect('/error?message=' + encodeURIComponent('Payment details are invalid. Please check your card number, expiry, and CVC.'))
  }

  console.log('[Checkout] Processing order for user:', userId, userEmail)

  // ── Insert order into Supabase ─────────────────────────────────────────
  // If using Firebase auth, user_id will be the Firebase UID (stored as text).
  // Ensure your orders table allows this (uuid or text column).
  const { data: newOrder, error } = await supabase
    .from('orders')
    .insert({
      user_id: supabaseUser?.id || null,   // only set if Supabase user exists
      total_price: 120.00,
      status: 'Confirmed',
    })
    .select('id, total_price, status')
    .single()

  if (error) {
    console.error('[Checkout] Supabase insert error:', error.code, error.message)
    redirect(`/error?message=${encodeURIComponent('Order error: ' + error.message)}`)
  }

  console.log('[Checkout] Order created:', newOrder)

  revalidatePath('/order', 'page')
  revalidatePath('/account', 'page')

  const recipientName = `${firstName} ${lastName}`.trim()
  const fullAddress = `${address}, ${city} ${postalCode}`.trim()

  redirect(
    `/order/confirmation?orderId=${encodeURIComponent(newOrder?.id || 'SUCCESS')}` +
    `&name=${encodeURIComponent(recipientName)}` +
    `&address=${encodeURIComponent(fullAddress)}`
  )
}
