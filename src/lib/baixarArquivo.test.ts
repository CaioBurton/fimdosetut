import { afterEach, describe, expect, it, vi } from 'vitest'
import { baixarCsv, baixarJson } from './baixarArquivo'

describe('baixarJson', () => {
  afterEach(() => vi.restoreAllMocks())

  it('gera um arquivo JSON com o nome pedido e libera a URL depois', () => {
    const criar = vi.fn(() => 'blob:fake')
    const revogar = vi.fn()
    Object.assign(URL, { createObjectURL: criar, revokeObjectURL: revogar })
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    baixarJson('dados.json', { a: 1 })

    expect(criar).toHaveBeenCalledTimes(1)
    const blob = (criar.mock.calls[0] as unknown as [Blob])[0]
    expect(blob.type).toBe('application/json')
    expect(clique).toHaveBeenCalledTimes(1)
    expect(revogar).toHaveBeenCalledWith('blob:fake')
    expect(document.querySelector('a[download]')).toBeNull()
  })
})

describe('baixarCsv', () => {
  afterEach(() => vi.restoreAllMocks())

  it('gera um arquivo CSV com BOM para o Excel', async () => {
    const criar = vi.fn(() => 'blob:fake')
    Object.assign(URL, { createObjectURL: criar, revokeObjectURL: vi.fn() })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    baixarCsv('dados.csv', 'a;b')

    const blob = (criar.mock.calls[0] as unknown as [Blob])[0]
    expect(blob.type).toBe('text/csv;charset=utf-8')
    expect(new Uint8Array(await blob.arrayBuffer()).slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf]))
  })
})
