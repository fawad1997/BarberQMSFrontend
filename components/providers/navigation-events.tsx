'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProgressBar from '@/components/ui/progress-bar';

export default function NavigationEvents() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Show loading state
    setIsLoading(true);
    
    // Create a short delay to ensure the loading indicator is visible
    // even during fast page transitions
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return <ProgressBar isLoading={isLoading} />;
} 