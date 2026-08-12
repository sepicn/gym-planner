import { type ButtonHTMLAttributes, forwardRef } from "react"
import { Loader2 } from "lucide-react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  loadingText?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"

    const variants = {
      primary: "bg-accent text-black hover:bg-accent-hover",
      secondary:
        "bg-card text-foreground border border-border hover:bg-border",
      ghost: "text-muted hover:text-foreground hover:bg-card",
    }

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-8 py-3 text-lg",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2
              className={`${size === "lg" ? "w-5 h-5" : "w-4 h-4"} animate-spin`}
              aria-hidden="true"
            />
            {loadingText ?? children}
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)

Button.displayName = "Button"
