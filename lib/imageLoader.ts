export const preloadImages = (
  frameCount: number,
  onProgress: (progress: number) => void
): Promise<HTMLImageElement[]> => {
  return new Promise((resolve) => {
    let loadedCount = 0;
    const images: HTMLImageElement[] = [];
    
    // Frames are named ezgif-frame-015.png to ezgif-frame-056.png (42 frames)
    const startIndex = 15;
    
    for (let i = 0; i < frameCount; i++) {
      const img = new Image();
      const frameNum = (startIndex + i).toString().padStart(3, '0');
      const src = `/images/sequence/ezgif-frame-${frameNum}.png`;
      
      img.onload = () => {
        loadedCount++;
        onProgress(Math.round((loadedCount / frameCount) * 100));
        
        if (loadedCount === frameCount) {
          resolve(images);
        }
      };
      
      img.onerror = () => {
        console.error(`Failed to load image at sequence: ${src}`);
        loadedCount++; // Avoid hanging loading screen
        if (loadedCount === frameCount) {
          resolve(images);
        }
      }

      img.src = src;
      images.push(img);
    }
  });
};
