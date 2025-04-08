"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { siteConfig } from "@/config/site"
import { navLinks } from "@/lib/links"
import { settings } from "@/config/settings"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faSignInAlt, faSignOutAlt, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { useSession, signOut } from "next-auth/react"
import { getNavLinks } from "@/lib/getNavLinks"

export default function Navbar() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [navbar, setNavbar] = useState(false)
  const navigationLinks = getNavLinks(session?.user?.role)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({})

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
      const isInsideAnyDropdown = Object.values(dropdownRefs.current).some(
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
                              <li key={item.route} className="px-4 py-2 hover:bg-muted transition-colors duration-150">
                                <button
                                  onClick={() => handleDropdownItemClick(
                                    item.path, 
                                    // Open Walk-Ins in a new tab
                                    item.path === "/shop/walkins"
                                  )}
                                  className="flex items-center gap-2 whitespace-nowrap w-full text-left"
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
            </ul>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4">
          {status === "authenticated" ? (
            <>
              <span className="text-sm text-muted-foreground">
                {session.user?.name}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 hover:underline"
              >
                <FontAwesomeIcon icon={faSignOutAlt} />
                Logout
              </button>
            </>
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
    </header>
  )
}
