"use client";
import { motion } from "framer-motion";
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 z-10 pointer-events-auto overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-luxury-black to-black z-0 pointer-events-none" />
      
      {/* Huge animated bloom */}
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[900px] h-[600px] md:h-[900px] bg-brand-coral/30 rounded-full blur-[150px] -z-10 pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        viewport={{ once: true, margin: "-10%" }}
        className="z-10 flex flex-col items-center"
      >
        <h2 className="text-5xl md:text-8xl font-light tracking-widest text-white mb-12 uppercase text-glow drop-shadow-2xl">
          Taste the <br className="md:hidden" /><span className="font-serif italic text-brand-coral lowercase md:ml-4 text-glow-coral">Luxury</span>
        </h2>
        
        <Link href="#order" onClick={(e) => { 
          e.preventDefault();
          document.querySelector('#order')?.scrollIntoView({ behavior: 'smooth' });
        }} className="block">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative px-14 py-6 bg-white text-black font-semibold tracking-[0.25em] uppercase rounded-full overflow-hidden group shadow-[0_0_40px_rgba(255,107,157,0.3)] hover:shadow-[0_0_80px_rgba(255,107,157,0.6)] transition-all duration-500 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-coral to-brand-red translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
            <span className="relative z-10 group-hover:text-white transition-colors duration-500">ORDER NOW</span>
          </motion.div>
        </Link>
      </motion.div>

      <footer className="absolute bottom-8 text-[10px] md:text-xs text-white/30 tracking-[0.3em] font-sans z-10 uppercase">
        © 2026 STRAWBERRY JUICE CO. ALL RIGHTS RESERVED.
      </footer>
    </section>
  );
}
