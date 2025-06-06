"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { siteConfig } from "@/config/site"
import { navLinks } from "@/lib/links"
import { settings } from "@/config/settings"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faSignInAlt, faSignOutAlt, faChevronDown, faUserEdit } from '@fortawesome/free-solid-svg-icons'
import { signOut } from "next-auth/react"
import { getNavLinks } from "@/lib/getNavLinks"
import { EditProfileDialog } from "@/components/pages/auth/edit-profile-dialog"
import { useSessionUpdate } from "@/lib/hooks/useSessionUpdate"
import { useWalkthrough } from "@/components/walkthrough"

export default function Navbar() {
  const router = useRouter()
  const { session, sessionKey, status } = useSessionUpdate()
  const { isActive: walkthroughActive, currentStep, highlightTarget } = useWalkthrough()
  const [navbar, setNavbar] = useState(false)
  const navigationLinks = getNavLinks(session?.user?.role)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({})
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  
  // Debug log for session updates in navbar
  useEffect(() => {
    console.log("Navbar rendering with session:", session?.user?.name, "Key:", sessionKey);
  }, [session, sessionKey]);
  // Handle walkthrough dropdown auto-opening
  useEffect(() => {
    if (walkthroughActive && highlightTarget) {
      // Open Shops dropdown when highlighting dropdown items
      if (['manage-shops', 'artists', 'shop-services'].includes(highlightTarget)) {
        setOpenDropdown("Shops")
      }
    }
  }, [walkthroughActive, highlightTarget])
  // Helper function to determine if an item should be highlighted during walkthrough
  const getItemHighlightClass = (itemRoute: string) => {
    if (!walkthroughActive || !highlightTarget) return ""
    
    // Map dropdown targets to item routes
    const highlightMap: { [key: string]: string } = {
      "manage-shops": "Manage Shops",
      "artists": "Artists", 
      "shop-services": "Shop Services"
    }
      if (highlightMap[highlightTarget] === itemRoute) {
      return "bg-primary/10 border-2 border-primary/50 ring-2 ring-primary/20 transition-all duration-1000 animate-[glow_2s_ease-in-out_infinite_alternate]"
    }
    
    return ""
  }

  const handleClick = async () => {
    setNavbar(false)
    setOpenDropdown(null)
  }

  const handleDropdownItemClick = (path: string, openInNewTab: boolean = false) => {
    if (openInNewTab) {
      // Open in a new tab
      window.open(path, '_blank')
      
      // Close dropdown after opening in new tab
      setTimeout(() => {
        setOpenDropdown(null)
        setNavbar(false)
      }, 100)
    } else {
      // Navigate in the same tab
      router.push(path)
      
      // Set a timeout to close the dropdown after navigation starts
      setTimeout(() => {
        setOpenDropdown(null)
        setNavbar(false)
      }, 100)
    }
  }

  const toggleDropdown = (route: string) => {
    setOpenDropdown(openDropdown === route ? null : route)
  }

  const toggleUserMenu = () => {
    setOpenDropdown(openDropdown === "userMenu" ? null : "userMenu")
  }

  useEffect(() => {
    if (navbar) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
  }, [navbar])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if we're clicking inside any of our dropdown refs
      const isInsideAnyDropdown = Object.values({
        ...dropdownRefs.current, 
        userMenu: userMenuRef.current
      }).some(
        (ref) => ref && ref.contains(event.target as Node)
      )
      
      if (!isInsideAnyDropdown) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/" })
  }

  const handleEditProfile = () => {
    setShowProfileDialog(true)
    setOpenDropdown(null)
  }

  const handleProfileDialogClose = () => {
    // Force a re-render of the navbar after profile dialog closes
    console.log("Profile dialog closed, forcing navbar update");
    setShowProfileDialog(false);
    // Use setTimeout to ensure dialog is fully closed before re-render
    setTimeout(() => {
      setOpenDropdown(null);
      // Force a re-render by toggling navbar state
      setNavbar(prev => !prev);
      setNavbar(prev => !prev);
    }, 100);
  }

  return (
    <header className="select-none">
      <nav className="mx-auto justify-between px-4 md:flex md:items-center md:px-8 lg:max-w-7xl">
        <div>
          <div className="flex items-center justify-between py-3 md:block md:py-5">
            <Link href="/" onClick={handleClick}>
              <h1 className="text-2xl font-bold duration-200 lg:hover:scale-[1.10]">
                {siteConfig.name}
              </h1>
            </Link>
            <div className="flex gap-1 md:hidden">
              <button
                className="rounded-md p-2 text-primary outline-none focus:border focus:border-primary"
                aria-label="Hamburger Menu"
                onClick={() => setNavbar(!navbar)}
              >
                {navbar ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 "
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 "
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
              <ModeToggle />
            </div>
          </div>
        </div>
        <div>
          <div
            className={`absolute left-0 right-0 z-10 m-auto justify-self-center rounded-md border bg-background p-4 md:static md:mt-0 md:block md:border-none md:p-0 ${
              navbar ? "block" : "hidden"
            }`}
            style={{ width: "100%", maxWidth: "20rem" }}
          >
            <ul className="flex flex-col items-center space-y-4 text-primary opacity-60 md:flex-row md:space-x-6 md:space-y-0">
              {navigationLinks.map((link) => (
                <li key={link.route} className="relative">
                  {link.dropdown ? (
                    <div 
                      className="flex flex-col md:flex-row" 
                      ref={(el) => dropdownRefs.current[link.route] = el}
                    >
                      <button
                        className="flex items-center gap-2 hover:underline"
                        onClick={() => toggleDropdown(link.route)}
                      >
                        <i className={link.icon}></i>
                        {link.route}
                        <FontAwesomeIcon icon={faChevronDown} className={`h-3 w-3 transition-transform ${openDropdown === link.route ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {openDropdown === link.route && (
                        <div className="md:absolute mt-2 md:mt-0 md:top-full left-0 bg-background border rounded-md shadow-md z-20 w-48 md:w-auto origin-top-left transition-all duration-200 animate-in fade-in-50 slide-in-from-top-5">
                          <ul className="py-1">
                            {link.items.map((item) => (
                              <li key={item.route} className={`px-4 py-2 hover:bg-muted transition-colors duration-150 rounded-md mx-1 ${getItemHighlightClass(item.route)}`}>
                                <button
                                  onClick={() => handleDropdownItemClick(
                                    item.path, 
                                    // Open Walk-Ins in a new tab
                                    item.path === "/shop/walkins"
                                  )}
                                  className={`flex items-center gap-2 whitespace-nowrap w-full text-left ${getItemHighlightClass(item.route)}`}
                                >
                                  <i className={item.icon}></i>
                                  {item.route}
                                  {item.path === "/shop/walkins" && (
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="12" 
                                      height="12" 
                                      viewBox="0 0 24 24" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      strokeWidth="2" 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      className="ml-1 opacity-70"
                                    >
                                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                      <polyline points="15 3 21 3 21 9"></polyline>
                                      <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      className="hover:underline flex items-center gap-2"
                      href={link.path}
                      onClick={handleClick}
                    >
                      <i className={link.icon}></i>
                      {link.route}
                    </Link>
                  )}
                </li>
              ))}

              {/* Mobile User Menu */}
              {session && navbar && (
                <li className="md:hidden w-full">
                  <div className="border-t pt-2 mt-2 w-full">
                    <div className="text-sm text-muted-foreground mb-2 text-center" data-profile-name key={`mobile-name-${sessionKey}`}>
                      {session?.user?.name || "User"}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleEditProfile}
                        className="flex items-center justify-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <FontAwesomeIcon icon={faUserEdit} className="text-primary/80" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center justify-center gap-2 p-2 rounded-md hover:bg-muted transition-colors text-red-500 dark:text-red-400"
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="flex items-center gap-2 hover:underline"
              >
                <span className="text-sm text-muted-foreground" data-profile-name key={`desktop-name-${sessionKey}`}>
                  {session?.user?.name || "User"}
                </span>
                <FontAwesomeIcon icon={faChevronDown} className={`h-3 w-3 transition-transform ${openDropdown === "userMenu" ? 'rotate-180' : ''}`} />
              </button>
              
              {openDropdown === "userMenu" && (
                <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-md z-20 w-48 origin-top-right transition-all duration-200 animate-in fade-in-50 slide-in-from-top-5">
                  <ul className="py-1">
                    <li className="px-4 py-2 hover:bg-muted transition-colors duration-150">
                      <button
                        onClick={handleEditProfile}
                        className="flex items-center gap-2 w-full text-left"
                      >
                        <FontAwesomeIcon icon={faUserEdit} className="w-4 h-4 text-primary/80" />
                        <span>Edit Profile</span>
                      </button>
                    </li>
                    <li className="border-t mt-1 pt-1 px-4 py-2 hover:bg-muted transition-colors duration-150">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full text-left text-red-500 dark:text-red-400"
                      >
                        <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* WIll hide register for now
              <Link 
                href="/register" 
                className="flex items-center gap-2 hover:underline"
              >
                <FontAwesomeIcon icon={faUser} />
                Register
              </Link> */}
              <Link 
                href="/login" 
                className="flex items-center gap-2 hover:underline"
              >
                <FontAwesomeIcon icon={faSignInAlt} />
                Login
              </Link>
            </>
          )}
          {settings.themeToggleEnabled && <ModeToggle />}
        </div>
      </nav>
      
      {/* Edit Profile Dialog */}
      <EditProfileDialog 
        isOpen={showProfileDialog} 
        onClose={handleProfileDialogClose}
      />
    </header>
  )
}
