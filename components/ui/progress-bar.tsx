import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  isLoading: boolean;
  className?: string;
}

export default function ProgressBar({ 
  isLoading, 
  className 
}: ProgressBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let startTime: number | null = null;
    const duration = 3000; // 3 seconds max duration

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      // Calculate progress but never reach 100% until loading is complete
      // This creates a gradually slowing progress that mimics real-world loading
      const newProgress = Math.min(99, (elapsed / duration) * 100);
      
      setProgress(elapsed < duration ? newProgress : 99);
      
      if (isLoading && elapsed < duration) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    if (isLoading) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      // When loading is complete, quickly finish the progress bar
      setProgress(100);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isLoading]);

  return (
    <div className={cn("fixed top-0 left-0 right-0 h-1 z-50", className)}>
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%`, opacity: isLoading || progress < 100 ? 1 : 0 }}
      />
    </div>
  );
} 