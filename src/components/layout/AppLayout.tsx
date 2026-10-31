import type { ReactNode } from 'react'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

interface AppLayoutProps {
  title: string
  children: ReactNode
  noScroll?: boolean
}

export function AppLayout({ title, children, noScroll = false }: AppLayoutProps) {
  return (
    <div className="flex h-full flex-col">
      <Header title={title} />
      <main className={noScroll ? 'flex-1 overflow-hidden pb-[calc(60px+env(safe-area-inset-bottom))]' : 'flex-1 overflow-y-auto pb-20'}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
