'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { placeOrder } from "@/app/actions/order";

export default function OrderSection() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  return (
    <section className="relative min-h-screen bg-luxury-black/80 backdrop-blur-xl text-white overflow-hidden py-32 rounded-t-[4rem] border-t border-white/10">
      {/* Ambient background glows */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 -left-32 w-[600px] h-[600px] bg-brand-red/20 rounded-full blur-[150px] pointer-events-none -z-10"
      />
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 -right-32 w-[600px] h-[600px] bg-brand-coral/20 rounded-full blur-[150px] pointer-events-none -z-10"
      />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl md:text-6xl font-light tracking-widest text-glow uppercase">Secure Checkout</h2>
          <p className="text-white/50 tracking-widest mt-4 uppercase text-sm">Experience the pure taste of luxury</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Left Column: Product Showcase */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center relative"
          >
            <motion.div 
              whileHover={{ scale: 1.05, rotateY: 10, rotateX: 5 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="relative w-full max-w-md aspect-[3/4] glass-panel rounded-[2rem] p-10 flex flex-col items-center justify-between group overflow-hidden cursor-pointer"
              style={{ perspective: 1000 }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-coral/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="text-center relative z-10 w-full mb-6">
                <h3 className="text-3xl tracking-widest font-light mb-2 uppercase drop-shadow-md">Premium Nectar</h3>
                <p className="text-brand-coral font-medium tracking-widest text-xs uppercase opacity-80">100% Organic Cold-Pressed</p>
              </div>

              {/* 3D Glowing Bottle Silhouette */}
              <div className="relative w-full flex-1 flex items-center justify-center my-8 z-10">
                 <motion.div 
                   animate={{ y: [0, -15, 0] }}
                   transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                   className="w-28 h-64 md:h-72 rounded-t-[50px] rounded-b-2xl border border-white/30 bg-gradient-to-b from-brand-red/50 to-black/80 shadow-[0_0_60px_rgba(255,107,157,0.4)] backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center"
                 >
                   <div className="absolute bottom-0 left-0 right-0 h-[80%] bg-gradient-to-t from-brand-red/80 to-brand-coral/60 mix-blend-overlay"></div>
                   <div className="absolute inset-y-4 left-3 w-1.5 bg-white/40 rounded-full blur-[1px]"></div>
                   <div className="absolute top-8 right-3 w-1 h-12 bg-white/20 rounded-full blur-[1px]"></div>
                 </motion.div>
              </div>

              <div className="flex w-full justify-between items-end relative z-10 mt-6">
                <div className="text-xs text-white/50 tracking-widest uppercase">1x 500ml Bottle</div>
                <div className="text-4xl font-light text-glow">$120.00</div>
              </div>
            </motion.div>
            
            <div className="flex gap-8 mt-12 opacity-60">
              <span className="text-xs tracking-[0.2em] border-b border-white/20 pb-1 hover:text-white transition-colors">WORLDWIDE SHIPPING</span>
              <span className="text-xs tracking-[0.2em] border-b border-white/20 pb-1 hover:text-white transition-colors">SECURE PAYMENT</span>
            </div>
          </motion.div>

          {/* Right Column: Premium Checkout Form */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center"
          >
            <div className="glass-panel rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)]">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-coral to-brand-red" />
              
              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center opacity-50 relative z-10 min-h-[400px]">
                  <p className="tracking-widest uppercase font-light text-sm animate-pulse">Checking Secure Session...</p>
                </div>
              ) : !user ? (
                <div className="flex flex-col items-center justify-center py-20 text-center relative z-10 min-h-[400px]">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,107,157,0.2)]">
                    <span className="text-2xl opacity-50">🔒</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-light tracking-widest text-white uppercase mb-4">Members Only Checkout</h3>
                  <p className="text-sm text-white/50 tracking-widest text-center uppercase mb-10 max-w-sm">Please log in or create an account to secure your premium nectar allocation.</p>
                  
                  <Link href="/login" className="px-10 py-5 bg-brand-coral text-white font-semibold tracking-widest text-xs uppercase rounded-full hover:bg-brand-red transition-all duration-300 shadow-[0_0_20px_rgba(255,107,157,0.4)] hover:shadow-[0_0_40px_rgba(255,107,157,0.6)]">
                    Login to Secure Order
                  </Link>
                </div>
              ) : (
                <form action={placeOrder} className="flex flex-col gap-8 relative z-10">
                  <div>
                    <h4 className="text-xs font-semibold tracking-widest uppercase text-brand-coral mb-4">Contact Information</h4>
                    <div className="flex flex-col gap-3">
                      <input type="email" placeholder="Email Address" defaultValue={user.email} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold tracking-widest uppercase text-brand-coral mb-4">Shipping Address</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <input type="text" placeholder="First Name" className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light" />
                        <input type="text" placeholder="Last Name" className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light" />
                      </div>
                      <input type="text" placeholder="Full Address" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light" />
                      <div className="flex gap-3">
                        <input type="text" placeholder="City" className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light" />
                        <input type="text" placeholder="Postal Code" className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold tracking-widest uppercase text-brand-coral mb-4">Secure Payment</h4>
                    <div className="flex flex-col gap-3">
                      <input type="text" placeholder="Card Number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 tracking-widest text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light" />
                      <div className="flex gap-3">
                        <input type="text" placeholder="MM/YY" className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 tracking-widest text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light" />
                        <input type="text" placeholder="CVC" className="w-1/2 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 tracking-widest text-white placeholder-white/30 focus:outline-none focus:border-brand-coral/60 focus:bg-white/10 transition-all duration-300 font-light" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-8">
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-white/60 font-light tracking-widest uppercase text-sm">Order Total</span>
                      <span className="text-3xl font-light text-glow">$120.00</span>
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full relative px-8 py-6 bg-white text-black font-semibold tracking-[0.25em] text-xs md:text-sm uppercase rounded-2xl overflow-hidden group shadow-[0_0_30px_rgba(255,107,157,0.2)] hover:shadow-[0_0_60px_rgba(255,107,157,0.5)] transition-all duration-500"
                      type="submit"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-coral to-brand-red translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
                      <span className="relative z-10 group-hover:text-white transition-colors duration-500">Complete Purchase</span>
                    </motion.button>
                  </div>

                </form>
              )}
            </div>
            
            <p className="text-center mt-8 text-[10px] text-white/30 tracking-[0.25em]">ENCRYPTED & SECURE <br className="md:hidden"/>POWERED BY STRIPE</p>

          </motion.div>
        </div>
      </div>
    </section>
  )
}
