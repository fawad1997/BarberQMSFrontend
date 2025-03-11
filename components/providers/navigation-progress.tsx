import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function NavigationProgress() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Show loading state
    setIsLoading(true);
    
    // Hide loading state after a short delay
    timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname, searchParams]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center">
      <div className="bg-background shadow-md rounded-b-lg p-2 flex items-center gap-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  );
} 