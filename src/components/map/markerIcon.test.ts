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

  it('desenha a denúncia de parada em verde claro, com o ícone de ponto de ônibus e sem código', () => {
    const icone = criarIconeZona('#1e8e3e', false, '', false, 1, 0, false, true)

    expect(icone.options.html).toContain('fill="#f3fcee"')
    expect(icone.options.html).not.toContain('fill="#1e8e3e"')
    expect(icone.options.html).toContain('M12 12.5V21.5')
    expect(icone.options.html).not.toContain('>!<')
  })

  it('não confunde o ícone de parada com o de ônibus no cache', () => {
    const onibus = criarIconeZona('#1e8e3e', false)
    const parada = criarIconeZona('#1e8e3e', false, '', false, 1, 0, false, true)

    expect(onibus).not.toBe(parada)
    expect(onibus.options.html).toContain('>!<')
  })
})
