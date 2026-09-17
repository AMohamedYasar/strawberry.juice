"use client";
import { motion } from "framer-motion";

export default function GlassCard({ title, desc }: { title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.05, rotateY: 5, rotateX: 5 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-8 md:p-10 rounded-2xl glass-panel relative overflow-hidden group cursor-pointer"
      style={{ perspective: 1000 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <h3 className="text-2xl font-medium text-white mb-4 drop-shadow-lg relative z-10">{title}</h3>
      <p className="text-white/70 leading-relaxed font-light relative z-10 text-lg">{desc}</p>
    </motion.div>
  );
}
