import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: string
  outlined?: boolean
}

export function Badge({ children, color = '#084400', outlined = false }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold"
      style={
        outlined
          ? { color, border: `1px solid ${color}`, background: 'transparent' }
          : { backgroundColor: color, color: '#fff' }
      }
    >
      {children}
    </span>
  )
}
