import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-brand-green text-brand-cream border-2 border-brand-green active:bg-brand-green-dark',
  secondary:
    'bg-transparent text-brand-green border-2 border-brand-green active:bg-brand-green/10',
  ghost: 'bg-transparent text-brand-green border-2 border-transparent active:bg-brand-green/10',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`ttl min-h-12 w-full rounded-[2px] px-4 py-3 text-base transition-colors disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
