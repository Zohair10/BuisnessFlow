import type { Metadata } from "next"
import { LandingPage } from "@/components/landing/LandingPage"

export const metadata: Metadata = {
  title: "Buisness Flow — AI-Powered Conversational Analytics",
  description: "Ask your data questions in plain English. Get instant answers as text, tables, or charts. No SQL required. Start free today.",
  keywords: ["AI analytics", "conversational analytics", "data visualization", "business intelligence", "natural language query", "SQL alternative"],
  openGraph: {
    title: "Buisness Flow — AI-Powered Conversational Analytics",
    description: "Ask your data questions in plain English. Get instant answers as text, tables, or charts.",
    type: "website",
  },
}

export default function HomePage() {
  return <LandingPage />
}
