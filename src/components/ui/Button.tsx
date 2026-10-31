import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-brand-green text-white active:bg-brand-green-dark',
  secondary: 'bg-brand-cream text-brand-green border border-brand-green active:bg-brand-green/10',
  ghost: 'bg-transparent text-brand-green active:bg-brand-green/10',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`w-full rounded-xl px-4 py-3 text-base font-semibold transition-colors disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
