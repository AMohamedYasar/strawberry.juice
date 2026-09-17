"use client";
import SectionTitle from "./ui/SectionTitle";
import GlassCard from "./ui/GlassCard";
import { motion } from "framer-motion";

export default function IngredientsSection() {
  return (
    <section className="relative min-h-screen py-32 z-10 pointer-events-auto">
      <div className="container mx-auto px-6 max-w-6xl">
        <SectionTitle subtitle="What's inside">The Essence</SectionTitle>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
            <GlassCard 
              title="100% Organic Strawberries" 
              desc="Sourced exclusively from premium, sustainable farms ensuring the boldest flavor." 
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} viewport={{ once: true }}>
            <GlassCard 
              title="Cold-Pressed Magic" 
              desc="Our state-of-the-art cold-press technique extracts maximum nutrients without heat." 
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} viewport={{ once: true }}>
            <GlassCard 
              title="Zero Refined Sugar" 
              desc="Naturally sweetened by the fruit itself. We believe perfection needs no enhancement." 
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
