"use client"

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { SectionWrapper } from "@/components/landing/shared/SectionWrapper"
import { SectionReveal } from "@/components/landing/shared/SectionReveal"
import { GradientHeading } from "@/components/landing/shared/GradientHeading"

const faqs = [
  {
    question: "What databases does Buisness Flow support?",
    answer:
      "We support PostgreSQL, MySQL, CSV file uploads, and Excel files out of the box. MongoDB is available as a beta connector. All connections use encrypted credentials and read-only access.",
  },
  {
    question: "Do I need to know SQL to use Buisness Flow?",
    answer:
      "Not at all. Buisness Flow translates your natural language questions into optimized queries automatically. Just type your question in plain English and get instant results.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. All credentials are encrypted with AES-256-GCM. We use read-only database connections, enforce workspace isolation, and never store your query results on our servers. Your data stays in your infrastructure.",
  },
  {
    question: "How does the AI understand my data?",
    answer:
      "Buisness Flow uses intelligent schema retrieval to understand your database structure, table relationships, and column meanings. You can also add business glossary terms and KPI definitions for even more accurate results.",
  },
  {
    question: "Can I share insights with my team?",
    answer:
      "Yes. Buisness Flow supports team workspaces with role-based access control. You can export charts as PNG, download data as CSV, and share query sessions with teammates.",
  },
  {
    question: "What happens when I run out of queries?",
    answer:
      "Free plan includes 100 queries per month. Pro and Enterprise plans offer higher or unlimited quotas. You'll receive a notification when you're approaching your limit.",
  },
  {
    question: "Can I upload my own data files?",
    answer:
      "Yes. You can upload CSV and Excel files (up to 25MB on Free, 100MB on Pro). Files are stored securely in S3/R2 and treated as reusable data connections.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "The Free plan is always free with 100 monthly queries. Pro plan includes a 7-day free trial with full access to all features. No credit card required to start.",
  },
]

export function FAQSection() {
  return (
    <SectionWrapper id="faq">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <SectionReveal>
            <GradientHeading className="text-3xl md:text-4xl mb-4">
              Frequently asked questions
            </GradientHeading>
          </SectionReveal>
        </div>

        <SectionReveal delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-white/80 hover:text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/60 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </SectionReveal>
      </div>
    </SectionWrapper>
  )
}
