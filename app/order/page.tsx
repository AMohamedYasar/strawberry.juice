// app/order/page.tsx
// This page now supports BOTH Supabase-auth users and Firebase-auth users.
// Supabase check is a soft check — Firebase users handled client-side in CheckoutClient.

import { createClient } from '@/utils/supabase/server'
import CheckoutClient from './CheckoutClient'

export default async function OrderPage() {
  // Try Supabase session (works for Supabase-authenticated users)
  const supabase = createClient()
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()

  // Fetch previous Supabase orders if user is a Supabase user
  let orders: any[] | null = null
  if (supabaseUser) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', supabaseUser.id)
    orders = data
  }

  // Pass Supabase user info (may be null for Firebase-auth users)
  // CheckoutClient will use Firebase auth state for Firebase users
  return <CheckoutClient supabaseUser={supabaseUser} orders={orders} />
}
