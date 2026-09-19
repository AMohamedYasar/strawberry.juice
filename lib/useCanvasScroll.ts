import { useEffect, useRef, useState } from "react";
import { preloadImages } from "./imageLoader";

export const FRAME_COUNT = 42;

export const useCanvasScroll = () => {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Preload
  useEffect(() => {
    preloadImages(FRAME_COUNT, setProgress).then((images) => {
      imagesRef.current = images;
      setIsLoaded(true);
      // Draw first frame immediately
      requestAnimationFrame(() => drawFrame(0));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const image = imagesRef.current[frameIndex];
    if (!image) return;

    // Use object-fit contain logic to draw image taking up available space without stretching
    const canvasObj = canvas.getBoundingClientRect();
    canvas.width = canvasObj.width;
    canvas.height = canvasObj.height;

    const hRatio = canvas.width / image.width;
    const vRatio = canvas.height / image.height;
    const ratio  = Math.min(hRatio, vRatio); // Use Max for cover, Min for contain
    const centerShift_x = (canvas.width - image.width * ratio) / 2;
    const centerShift_y = (canvas.height - image.height * ratio) / 2;  

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Dark background for transparent PNG
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(
      image,
      0, 0, image.width, image.height,
      centerShift_x, centerShift_y, image.width * ratio, image.height * ratio
    );
  };

  useEffect(() => {
    if (!isLoaded) return;
    
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const html = document.documentElement;
          // The canvas scroll should finish based on total document scrollable height
          const maxScrollTop = html.scrollHeight - window.innerHeight;
          const scrollFraction = maxScrollTop > 0 ? window.scrollY / maxScrollTop : 0;
          
          let frameIndex = Math.floor(scrollFraction * FRAME_COUNT);
          frameIndex = Math.min(FRAME_COUNT - 1, frameIndex);
          frameIndex = Math.max(0, frameIndex);
          
          drawFrame(frameIndex);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Draw frame on resize
    const handleResize = () => {
      if (!isLoaded) return;
       const html = document.documentElement;
       const maxScrollTop = html.scrollHeight - window.innerHeight;
       const scrollFraction = maxScrollTop > 0 ? window.scrollY / maxScrollTop : 0;
       let frameIndex = Math.floor(scrollFraction * FRAME_COUNT);
       frameIndex = Math.min(FRAME_COUNT - 1, frameIndex);
       frameIndex = Math.max(0, frameIndex);
       drawFrame(frameIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  return { progress, isLoaded, canvasRef };
};
