"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const title = "STRAWBERRY".split("");

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center pointer-events-none z-10 overflow-hidden">
      <motion.div style={{ y, opacity }} className="flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 px-8 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_20px_rgba(255,107,157,0.15)]"
        >
          <p className="text-brand-coral tracking-[0.4em] uppercase text-xs md:text-sm font-medium">
            Pure. Fresh. Premium.
          </p>
        </motion.div>
        
        <h1 className="text-6xl md:text-9xl font-light tracking-[0.2em] text-white text-center mix-blend-plus-lighter text-glow flex overflow-hidden py-4 ml-4">
          {title.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 120, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.9, delay: 0.6 + i * 0.04, ease: [0.2, 0.65, 0.3, 0.9] }}
              className="inline-block transform-gpu"
              style={{ transformOrigin: "bottom" }}
            >
              {char}
            </motion.span>
          ))}
        </h1>
      </motion.div>
    </section>
  );
}
