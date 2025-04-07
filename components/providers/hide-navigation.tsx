"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function HideNavigation() {
  const pathname = usePathname();
  const isWalkinsPage = pathname === '/shop/walkins';

  useEffect(() => {
    if (isWalkinsPage) {
      // Add a class to the body to hide navigation elements
      document.body.classList.add('hide-navigation');
    } else {
      // Remove the class when not on the walkins page
      document.body.classList.remove('hide-navigation');
    }

    // Cleanup
    return () => {
      document.body.classList.remove('hide-navigation');
    };
  }, [isWalkinsPage]);

  return null; // This component doesn't render anything
} 