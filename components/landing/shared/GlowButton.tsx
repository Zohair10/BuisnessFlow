import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

interface GlowButtonProps extends ButtonProps {
  className?: string
}

export function GlowButton({ children, className, ...props }: GlowButtonProps) {
  return (
    <Button
      className={cn(
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "shadow-[0_0_20px_rgba(6,182,212,0.3),0_0_60px_rgba(6,182,212,0.1)]",
        "hover:shadow-[0_0_30px_rgba(6,182,212,0.4),0_0_80px_rgba(6,182,212,0.15)]",
        "transition-all duration-300 font-semibold rounded-full px-8",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
