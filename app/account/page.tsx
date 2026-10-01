import { createClient } from '@/utils/supabase/server'
import AccountClient from '@/components/AccountClient'

export default async function AccountPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let orders: any[] | null = null
  if (user) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
    orders = data
  }

  return (
    <AccountClient
      initialSupabaseUser={user}
      initialOrders={orders}
    />
  )
}
