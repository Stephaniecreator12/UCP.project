import * as React from "react"

// 1. Composant Container Principal (Card)
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-xl border border-slate-200/80 bg-white text-slate-900 shadow-xs overflow-hidden transition-all duration-200 ${className || ""}`}
    {...props}
  />
))
Card.displayName = "Card"

// 2. En-tête de la carte (CardHeader)
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 p-5 bg-slate-50/50 border-b border-slate-100 ${className || ""}`}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// 3. Titre de la carte (CardTitle)
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-base font-bold text-slate-900 tracking-tight leading-none ${className || ""}`}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

// 4. Description de la carte (CardDescription)
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-xs font-medium text-slate-400 mt-1 ${className || ""}`}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

// 5. Corps de la carte (CardContent) -> Correction de la syntaxe {...props}
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={`p-6 ${className || ""}`} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

// 6. Pied de page (CardFooter)
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center p-5 pt-0 ${className || ""}`}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }