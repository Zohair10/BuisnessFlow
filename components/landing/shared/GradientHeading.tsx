import { cn } from "@/lib/utils"

interface GradientHeadingProps {
  children: React.ReactNode
  className?: string
  as?: "h1" | "h2" | "h3"
}

export function GradientHeading({ children, className, as: Tag = "h2" }: GradientHeadingProps) {
  return (
    <Tag className={cn("text-gradient font-bold text-[2.1rem] md:text-[2.75rem]", className)}>
      {children}
    </Tag>
  )
}
