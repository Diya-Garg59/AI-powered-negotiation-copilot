import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary:
    'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 hover:shadow-indigo-500/45 active:scale-[0.98]',
  secondary:
    'border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:border-white/25 active:scale-[0.98]',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  danger: 'bg-red-500/90 text-white hover:bg-red-400 active:scale-[0.98]',
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-40'

export function buttonClass(variant: Variant = 'primary', className = '') {
  return `${base} ${variants[variant]} ${className}`.trim()
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ className = '', variant = 'primary', ...props }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={buttonClass(variant, className)}
      {...props}
    />
  )
})
