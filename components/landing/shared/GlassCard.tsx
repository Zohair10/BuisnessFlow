import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-6",
        hover && "transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.15] hover:-translate-y-1 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  )
}
