import * as React from "react"

import { cn } from "@/lib/utils"

const baseClassName =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/15 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"

const variantClasses = {
  default: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
  destructive: "bg-rose-600 text-white shadow-sm hover:bg-rose-700",
  outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50",
  secondary: "bg-slate-100 text-slate-800 shadow-sm hover:bg-slate-200",
  ghost: "text-slate-800 hover:bg-slate-100",
  link: "text-emerald-700 underline-offset-4 hover:underline",
  ucp: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
} as const

const sizeClasses = {
  default: "h-10 px-4",
  sm: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
  icon: "h-10 w-10",
} as const

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses
  size?: keyof typeof sizeClasses
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        className={cn(baseClassName, variantClasses[variant], sizeClasses[size], className)}
        ref={ref}
        type={type}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button }
