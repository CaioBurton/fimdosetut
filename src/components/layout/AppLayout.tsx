import type { ReactNode } from 'react'
import { useDesktop } from '../../hooks/useDesktop'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { SidebarNav } from './SidebarNav'

interface AppLayoutProps {
  title: string
  children: ReactNode
  noScroll?: boolean
  /** Largura máxima do conteúdo no desktop. */
  largura?: 'normal' | 'estreita'
}

export function AppLayout({ title, children, noScroll = false, largura = 'normal' }: AppLayoutProps) {
  const desktop = useDesktop()

  if (desktop) {
    return (
      <div className="flex h-full bg-brand-cream">
        <SidebarNav />
        <main className={noScroll ? 'min-w-0 flex-1 overflow-hidden' : 'min-w-0 flex-1 overflow-y-auto'}>
          <h1 className="sr-only">{title}</h1>
          {noScroll ? (
            children
          ) : (
            <div className={`mx-auto w-full px-4 py-6 ${largura === 'estreita' ? 'max-w-3xl' : 'max-w-6xl'}`}>
              {children}
            </div>
          )}
        </main>
      </div>
    )
  }

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
