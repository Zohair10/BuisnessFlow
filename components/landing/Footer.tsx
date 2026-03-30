import { cn } from "@/lib/utils"

const footerLinks = {
  product: {
    title: "Product",
    links: ["Features", "Pricing", "Changelog", "Documentation"],
  },
  company: {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  legal: {
    title: "Legal",
    links: ["Privacy Policy", "Terms of Service", "Security"],
  },
}

function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: string[]
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white/60 mb-4">{title}</h4>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link}>
            <a
              href="#"
              className="text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6">
        {/* Top area */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.jpg" alt="Buisness Flow" className="w-8 h-8 rounded-md object-cover" />
              <span className="font-semibold text-lg">Buisness Flow</span>
            </div>
            <p className="text-sm text-white/30 mb-6 max-w-xs leading-relaxed">
              AI-powered conversational analytics for modern teams
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-white/30 hover:text-white/60 transition-colors"
                aria-label="Twitter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-white/30 hover:text-white/60 transition-colors"
                aria-label="GitHub"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </a>
              <a
                href="#"
                className="text-white/30 hover:text-white/60 transition-colors"
                aria-label="LinkedIn"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          <FooterLinkGroup
            title={footerLinks.product.title}
            links={footerLinks.product.links}
          />
          <FooterLinkGroup
            title={footerLinks.company.title}
            links={footerLinks.company.links}
          />
          <FooterLinkGroup
            title={footerLinks.legal.title}
            links={footerLinks.legal.links}
          />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/30">
            &copy; 2026 Buisness Flow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
