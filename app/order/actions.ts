'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function processOrder(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/error?message=Unauthorized. Please log in first.')
  }

  const firstName = (formData.get("firstName") as string || "").trim()
  const lastName = (formData.get("lastName") as string || "").trim()
  const address = (formData.get("address") as string || "").trim()
  const city = (formData.get("city") as string || "").trim()
  const postalCode = (formData.get("postalCode") as string || "").trim()
  const cardNumber = (formData.get("cardNumber") as string || "").trim().replace(/\s+/g, '')
  const expiry = (formData.get("expiry") as string || "").trim()
  const cvc = (formData.get("cvc") as string || "").trim()

  // Server-side validation
  if (!firstName || !lastName || !address || !city || !postalCode) {
    redirect('/error?message=' + encodeURIComponent('Shipping details are incomplete. Please provide all address fields.'))
  }

  if (!cardNumber || cardNumber.length < 13 || !expiry || !cvc) {
    redirect('/error?message=' + encodeURIComponent('Payment details are invalid. Please check your card number, expiry, and CVC.'))
  }

  console.log('[Checkout] Processing order for user:', user.id, user.email)

  // The Supabase orders table columns: id, user_id, total_price, status
  const { data: newOrder, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      total_price: 120.00,
      status: 'Confirmed'
    })
    .select('id, total_price, status')
    .single()

  if (error) {
    console.error('[Checkout] Supabase order insert failed:', error)
    redirect(`/error?message=${encodeURIComponent('Database error: ' + error.message)}`)
  }

  console.log('[Checkout] Order created successfully:', newOrder)

  revalidatePath('/order', 'page')
  revalidatePath('/account', 'page')

  const recipientName = `${firstName} ${lastName}`.trim()
  const fullAddress = `${address}, ${city} ${postalCode}`.trim()

  redirect(`/order/confirmation?orderId=${encodeURIComponent(newOrder?.id || 'SUCCESS')}&name=${encodeURIComponent(recipientName)}&address=${encodeURIComponent(fullAddress)}`)
}
