import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import "./globals.css"
import { Toaster } from "sonner"

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Buisness Flow — AI-Powered Conversational Analytics",
  description: "Ask your data questions in plain English. Get instant answers as text, tables, or charts. No SQL required.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={plusJakarta.className}>
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(220, 20%, 9%)',
              border: '1px solid hsl(220, 20%, 18%)',
              color: 'hsl(215, 25%, 90%)',
            },
          }}
        />
      </body>
    </html>
  )
}
