"use client";
import { useCanvasScroll } from "@/lib/useCanvasScroll";
import LoadingScreen from "../ui/LoadingScreen";

export default function SequenceCanvas() {
  const { progress, isLoaded, canvasRef } = useCanvasScroll();

  return (
    <>
      <LoadingScreen progress={progress} isLoaded={isLoaded} />
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-luxury-black/0 pointer-events-none z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-luxury-black/60 via-transparent to-luxury-black pointer-events-none z-10" />
         <canvas 
           ref={canvasRef} 
           className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
         />
      </div>
    </>
  );
}
