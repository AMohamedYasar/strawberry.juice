"use client";
import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const { user: firebaseUser } = useAuth();

  const user = firebaseUser || supabaseUser;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setSupabaseUser(data.user));
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSupabaseUser(session?.user ?? null);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: "-150%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none"
    >
      <div className="w-full max-w-6xl flex items-center justify-between bg-white/90 backdrop-blur-xl px-6 py-4 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.15)] pointer-events-auto border border-white/40">
        
        {/* Logo */}
        <Link href="/" className="text-black font-semibold tracking-widest uppercase text-sm md:text-base flex items-center gap-3 group">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-red to-brand-coral group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(255,107,157,0.5)]" />
          Juice Co.
        </Link>
        
        {/* Links */}
        <div className="flex items-center gap-3 md:gap-6">
          
          {user ? (
            <>
              <Link href="/order" className="bg-brand-coral text-white px-5 py-2.5 rounded-full font-medium tracking-widest text-xs uppercase hover:bg-brand-red transition-all duration-300 shadow-[0_4px_14px_rgba(255,107,157,0.4)] hover:shadow-[0_8px_25px_rgba(255,107,157,0.6)] transform hover:-translate-y-0.5">
                Order
              </Link>
              <Link href="/account" className="flex items-center gap-2.5 bg-luxury-black text-white px-5 py-2.5 rounded-full font-medium tracking-widest text-xs uppercase hover:bg-black transition-all duration-300 shadow-md transform hover:-translate-y-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-coral animate-pulse" />
                My Account
              </Link>
            </>
          ) : (
            <Link href="/login" className="bg-brand-coral text-white px-6 py-3 rounded-full font-medium tracking-widest text-xs md:text-sm uppercase hover:bg-brand-red transition-all duration-300 shadow-[0_4px_14px_rgba(255,107,157,0.4)] hover:shadow-[0_8px_25px_rgba(255,107,157,0.6)] transform hover:-translate-y-1">
              Create Account
            </Link>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
