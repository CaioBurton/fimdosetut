import { describe, expect, it } from 'vitest'
import { criarIconeZona } from './markerIcon'

describe('criarIconeZona', () => {
  it('usa opacidade cheia e símbolo de alerta para denúncias pendentes sem código', () => {
    const icone = criarIconeZona('#1e8e3e', false)

    expect(icone.options.html).toContain('fill="#1e8e3e"')
    expect(icone.options.html).toContain('opacity: 1')
    expect(icone.options.html).toContain('>!<')
  })

  it('usa opacidade reduzida e símbolo de check para denúncias resolvidas sem código', () => {
    const icone = criarIconeZona('#2563eb', true)

    expect(icone.options.html).toContain('fill="#2563eb"')
    expect(icone.options.html).toContain('opacity: 0.45')
    expect(icone.options.html).toContain('>✓<')
  })

  it('mostra o código da linha dentro da explosão', () => {
    const icone = criarIconeZona('#d64545', false, '063')

    expect(icone.options.html).toContain('>063<')
  })

  it('centraliza a ancoragem e aumenta o ícone quando selecionado', () => {
    const normal = criarIconeZona('#000', false)
    const grande = criarIconeZona('#000', false, '063', true)

    expect(normal.options.iconSize).toEqual([62, 40])
    expect(normal.options.iconAnchor).toEqual([31, 20])
    expect(grande.options.iconSize).toEqual([92, 58])
    expect(grande.options.iconAnchor).toEqual([46, 29])
  })
})
