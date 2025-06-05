/**
 * Navigation utilities for handling URL updates and redirects
 * Now prioritizes username over slug for salon identification
 */

/**
 * Updates the current URL when a salon's username changes
 * @param newUsername - The new username for the salon
 * @param router - Next.js router instance
 * @param currentPath - Current window location pathname (optional, defaults to window.location.pathname)
 * @returns true if redirect was performed, false otherwise
 */
export function updateSalonUrlAfterUsernameChange(
  newUsername: string,
  router: any,
  currentPath?: string
): boolean {
  const path = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '');
  
  // Check if we're currently on a salon page
  if (!path.includes('/salons/')) {
    return false;
  }

  try {
    const pathSegments = path.split('/');
    const salonIndex = pathSegments.indexOf('salons');
    
    if (salonIndex !== -1 && pathSegments[salonIndex + 1]) {
      // Extract any additional path segments after the salon identifier
      const restOfPath = pathSegments.slice(salonIndex + 2).join('/');
      
      // Build new path with updated username
      const newPath = `/salons/${newUsername}${restOfPath ? '/' + restOfPath : ''}`;
      
      // Only redirect if the URL is actually different
      if (newPath !== path) {
        router.push(newPath);
        return true;
      }
    }
  } catch (error) {
    console.error('Error updating salon URL after username change:', error);
  }
  
  return false;
}

/**
 * Checks if the current URL uses an outdated identifier and returns the preferred username URL
 * @param currentPath - Current window location pathname
 * @param salonUsername - The salon's current username to use in the URL
 * @returns The preferred URL with username, or null if no change needed
 */
export function getPreferredSalonUrl(currentPath: string, salonUsername: string): string | null {
  if (!currentPath.includes('/salons/')) {
    return null;
  }

  try {
    const pathSegments = currentPath.split('/');
    const salonIndex = pathSegments.indexOf('salons');
    
    if (salonIndex !== -1 && pathSegments[salonIndex + 1]) {
      const currentIdentifier = pathSegments[salonIndex + 1];
      
      // If current identifier is not the current username, update to use username
      if (currentIdentifier !== salonUsername) {
        const restOfPath = pathSegments.slice(salonIndex + 2).join('/');
        return `/salons/${salonUsername}${restOfPath ? '/' + restOfPath : ''}`;
      }
    }
  } catch (error) {
    console.error('Error getting preferred salon URL:', error);
  }
  
  return null;
}

/**
 * Ensures the URL reflects the current salon's username
 * @param salonUsername - The salon's current username
 * @param router - Next.js router instance
 * @param currentPath - Current window location pathname (optional)
 * @returns true if redirect was performed, false otherwise
 */
export function ensureSalonUrlUsesUsername(
  salonUsername: string,
  router: any,
  currentPath?: string
): boolean {
  const path = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '');
  const preferredUrl = getPreferredSalonUrl(path, salonUsername);
  
  if (preferredUrl && preferredUrl !== path) {
    router.replace(preferredUrl);
    return true;
  }
  
  return false;
}

/**
 * Updates URLs for shop owners when they edit their shop's username/slug
 * This handles updating the URL in both the shop management interface and public salon pages
 * @param newUsername - The new username/slug for the shop
 * @param router - Next.js router instance
 * @param currentPath - Current window location pathname (optional)
 * @returns true if redirect was performed, false otherwise
 */
export function updateShopUrlAfterUsernameChange(
  newUsername: string,
  router: any,
  currentPath?: string
): boolean {
  const path = currentPath || (typeof window !== 'undefined' ? window.location.pathname : '');
  
  try {
    // Handle shop management pages (/shop/...)
    if (path.includes('/shop/')) {
      // For shop management pages, just reload to refresh data
      // The URLs don't contain the shop username in the management interface
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return true;
    }
    
    // Handle public salon pages (/salons/...)
    if (path.includes('/salons/')) {
      return updateSalonUrlAfterUsernameChange(newUsername, router, currentPath);
    }
  } catch (error) {
    console.error('Error updating shop URL after username change:', error);
  }
  
  return false;
}
