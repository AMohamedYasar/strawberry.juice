import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { signout } from '../login/actions'

export default async function AccountPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-luxury-black text-white relative overflow-hidden pt-32 pb-20">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-full h-[500px] bg-brand-coral/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-red/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        {/* Header Profile Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-widest text-glow uppercase mb-2">My Account</h1>
            <p className="text-white/50 tracking-widest uppercase text-sm">Welcome back, {user.email}</p>
          </div>
          <form action={signout}>
            <button className="px-6 py-3 rounded-full border border-brand-coral/50 text-brand-coral font-semibold tracking-widest text-xs uppercase hover:bg-brand-coral hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(255,107,157,0.1)] hover:shadow-[0_0_25px_rgba(255,107,157,0.3)]">
              Log Out
            </button>
          </form>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area (Orders) */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-xl font-light tracking-widest uppercase text-white/80">Order History</h2>
            
            {!orders || orders.length === 0 ? (
              <div className="glass-panel p-10 rounded-3xl flex flex-col items-center justify-center text-center opacity-70">
                <p className="text-white/40 tracking-widest uppercase text-sm mb-4">No active orders found</p>
                <a href="#order" className="text-brand-coral hover:text-white transition-colors uppercase tracking-widest text-xs font-semibold">TREAT YOURSELF TODAY</a>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order: any) => (
                  <div key={order.id} className="glass-panel p-8 rounded-3xl group hover:border-brand-coral/30 transition-colors duration-500">
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                      <div>
                        <p className="text-brand-coral text-xs tracking-widest uppercase mb-1">Order #{order.id.substring(0,8)}</p>
                        <p className="text-white/40 text-xs tracking-widest uppercase">Placed: {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recently'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-light text-glow-coral">${order.total_price}</p>
                        <p className="text-[10px] tracking-[0.2em] uppercase mt-1 text-green-400/80 mix-blend-plus-lighter">{order.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-brand-red/30 to-brand-coral/20 flex items-center justify-center border border-white/10">
                        🥤
                      </div>
                      <div>
                        <p className="text-white tracking-widest text-sm uppercase font-light">Premium Nectar</p>
                        <p className="text-white/40 text-xs tracking-widest uppercase">Quantity: {order.quantity || 1}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Area (Settings & Links) */}
          <div className="space-y-8">
            <h2 className="text-xl font-light tracking-widest uppercase text-white/80">Preferences</h2>
            
            <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6">
              
              <div className="flex justify-between items-center group cursor-pointer">
                <div>
                  <h4 className="text-sm tracking-widest text-white uppercase font-light">Dark Mode</h4>
                  <p className="text-[10px] tracking-widest text-white/40 uppercase mt-1">Immersive Experience</p>
                </div>
                <div className="w-10 h-5 bg-brand-coral rounded-full relative shadow-[0_0_10px_rgba(255,107,157,0.4)]">
                   <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="h-[1px] w-full bg-white/5"></div>

              <div className="flex justify-between items-center group cursor-pointer">
                <div>
                  <h4 className="text-sm tracking-widest text-white uppercase font-light">Notifications</h4>
                  <p className="text-[10px] tracking-widest text-white/40 uppercase mt-1">Shipping Alerts</p>
                </div>
                <div className="text-brand-coral/50 group-hover:text-brand-coral transition-colors">➔</div>
              </div>

              <div className="h-[1px] w-full bg-white/5"></div>

              <div className="flex justify-between items-center group cursor-pointer">
                <div>
                  <h4 className="text-sm tracking-widest text-white uppercase font-light">Payment Methods</h4>
                  <p className="text-[10px] tracking-widest text-white/40 uppercase mt-1">Manage Cards securely</p>
                </div>
                <div className="text-brand-coral/50 group-hover:text-brand-coral transition-colors">➔</div>
              </div>

              <div className="h-[1px] w-full bg-white/5"></div>

              <div className="flex justify-between items-center group cursor-pointer opacity-50 hover:opacity-100 transition-opacity">
                <div>
                  <h4 className="text-sm tracking-widest text-white uppercase font-light text-brand-red">Privacy & Data</h4>
                  <p className="text-[10px] tracking-widest text-white/40 uppercase mt-1">Review permissions</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
