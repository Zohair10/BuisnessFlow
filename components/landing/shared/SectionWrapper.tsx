import { cn } from "@/lib/utils"

interface SectionWrapperProps {
  id?: string
  className?: string
  children: React.ReactNode
  fullWidth?: boolean
}

export function SectionWrapper({ id, className, children, fullWidth }: SectionWrapperProps) {
  return (
    <section id={id} className={cn("py-16 md:py-20 relative", className)}>
      {fullWidth ? (
        children
      ) : (
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6">
          {children}
        </div>
      )}
    </section>
  )
}
