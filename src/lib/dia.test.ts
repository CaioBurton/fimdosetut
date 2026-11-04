import { afterEach, describe, expect, it, vi } from 'vitest'
import { DIAS_PADRAO } from '../hooks/useDenuncias'
import { DIAS_CALENDARIO_MAPA, diaLocal, diaMinimo, diaMinimoMapa, hoje } from './dia'

describe('limites do calendário', () => {
  afterEach(() => vi.useRealTimers())

  it('o calendário da lista vai até DIAS_PADRAO dias atrás e o do mapa vai bem mais longe', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 15, 12))

    expect(hoje()).toBe('2026-11-15')
    expect(diaMinimo()).toBe(diaLocal(new Date(2026, 10, 15 - DIAS_PADRAO, 12).toISOString()))
    expect(diaMinimoMapa()).toBe('2025-11-15')
    expect(DIAS_CALENDARIO_MAPA).toBeGreaterThan(DIAS_PADRAO)
    expect(diaMinimoMapa() < diaMinimo()).toBe(true)
  })

  it('diaLocal usa a data local no formato do input de data', () => {
    expect(diaLocal(new Date(2026, 0, 5, 23, 30).toISOString())).toBe('2026-01-05')
  })
})
