import { vi } from 'vitest'

/** Simula uma janela larga (layout de desktop) até `restaurarLargura()`. */
export function simularDesktop() {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as never
}

export function restaurarLargura() {
  // @ts-expect-error volta ao ambiente sem matchMedia
  delete window.matchMedia
}
