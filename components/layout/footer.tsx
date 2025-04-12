import Link from "next/link"
import { siteConfig } from "@/config/site"
import { navLinks, footerLinks } from "@/lib/links"

export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto w-full max-w-screen-xl p-6 md:py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <Link href="/">
            <h1 className="mb-2 text-2xl font-bold sm:mb-0">
              {siteConfig.name}
            </h1>
          </Link>
          <ul className="mb-6 flex flex-wrap items-center text-primary opacity-60 sm:mb-0">
            {navLinks.map((link) => (
              <li key={link.route}>
                <Link href={link.path} className="mr-4 hover:underline md:mr-6">
                  {link.route}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Legal Links */}
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
          {footerLinks.map((link) => (
            <Link key={link.route} href={link.path} className="hover:text-primary hover:underline">
              {link.route}
            </Link>
          ))}
        </div>
        
        <hr className="my-6 text-muted-foreground sm:mx-auto lg:my-8" />
        <span className="block text-sm text-muted-foreground sm:text-center">
          © {new Date().getFullYear()}{" "}
          <a
            target="_blank"
            href="https://asarasoft.com"
            className="hover:underline"
          >
            AsaraSoft
          </a>
          . All Rights Reserved.
        </span>
      </div>
    </footer>
  )
}
