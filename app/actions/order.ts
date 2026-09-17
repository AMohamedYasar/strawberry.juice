'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function placeOrder(formData: FormData) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Derive simple dummy data or extract from form
  const quantity = 1; // Assume 1 bottle
  const total_price = 120.00; // Hardcoded from our premium display
  
  const { data, error } = await supabase
    .from('orders')
    .insert([
      { 
        user_id: user.id, 
        quantity: quantity, 
        total_price: total_price,
        status: 'paid' // Assuming payment gateway completed successfully in true prod
      }
    ])
    .select()

  if (error) {
    console.error('Order placement failed:', error)
    redirect('/error') // Or handle specific error UI
  }

  // Successfully placed
  revalidatePath('/account', 'layout')
  redirect('/account')
}
