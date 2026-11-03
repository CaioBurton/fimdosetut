function baixarBlob(nomeArquivo: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Baixa um objeto como arquivo JSON, sem passar por servidor (o conteúdo fica só no aparelho). */
export function baixarJson(nomeArquivo: string, dados: unknown) {
  baixarBlob(nomeArquivo, new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' }))
}

/** Baixa um texto CSV (UTF-8 com BOM, para o Excel mostrar os acentos certos). */
export function baixarCsv(nomeArquivo: string, csv: string) {
  baixarBlob(nomeArquivo, new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
}
