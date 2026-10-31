import { describe, expect, it } from 'vitest'
import { criarIconeZona } from './markerIcon'

describe('criarIconeZona', () => {
  it('usa opacidade cheia e símbolo de alerta para denúncias pendentes', () => {
    const icone = criarIconeZona('#1e8e3e', false)

    expect(icone.options.html).toContain('background: #1e8e3e')
    expect(icone.options.html).toContain('opacity: 1')
    expect(icone.options.html).toContain('>!<')
  })

  it('usa opacidade reduzida e símbolo de check para denúncias resolvidas', () => {
    const icone = criarIconeZona('#2563eb', true)

    expect(icone.options.html).toContain('background: #2563eb')
    expect(icone.options.html).toContain('opacity: 0.45')
    expect(icone.options.html).toContain('>✓<')
  })

  it('define tamanho e ancoragem consistentes do ícone', () => {
    const icone = criarIconeZona('#000', false)

    expect(icone.options.iconSize).toEqual([30, 30])
    expect(icone.options.iconAnchor).toEqual([15, 30])
  })
})
