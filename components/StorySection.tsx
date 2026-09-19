"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function StorySection() {
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const rawText = "Every single drop of our strawberry juice is cold-pressed within hours of harvest. No additives, no concentrates. Just the pure, vibrant taste of summer captured in an elegant glass bottle.";
  const words = rawText.split(" ");

  return (
    <section ref={containerRef} className="relative min-h-[150vh] flex flex-col items-center justify-start py-32 z-10 pointer-events-none">
       {/* Ambient Glow that breathes */}
       <motion.div 
         animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
         transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-brand-red/20 rounded-full blur-[150px] -z-10"
       />
       
       <div className="sticky top-[20vh] max-w-4xl mx-auto px-6 text-center">
         <motion.h2 
           className="text-3xl md:text-6xl font-light tracking-widest text-white leading-tight mb-12"
           style={{ 
             opacity: useTransform(scrollYProgress, [0, 0.2], [0, 1]), 
             y: useTransform(scrollYProgress, [0, 0.2], [40, 0]) 
           }}
         >
           HANDPICKED AT PEAK <br suppressHydrationWarning className="hidden md:block"/><span className="text-brand-coral text-glow-coral italic font-serif text-5xl md:text-8xl lowercase mt-2 inline-block">sweetness</span>
         </motion.h2>
         
         <p className="text-xl md:text-4xl text-white/20 leading-relaxed font-light flex flex-wrap justify-center gap-x-2 md:gap-x-3 gap-y-2">
           {words.map((word, i) => {
             const start = 0.2 + (i / words.length) * 0.6;
             const end = start + (0.5 / words.length);
             const opacity = useTransform(scrollYProgress, [start, end], [0.2, 1]);
             const filter = useTransform(scrollYProgress, [start, end], ["blur(8px)", "blur(0px)"]);
             
             return (
               <motion.span key={i} style={{ opacity, filter }} className="inline-block text-white shadow-black drop-shadow-md">
                 {word}
               </motion.span>
             );
           })}
         </p>
       </div>
    </section>
  );
}
