/** Baixa um objeto como arquivo JSON, sem passar por servidor (o conteúdo fica só no aparelho). */
export function baixarJson(nomeArquivo: string, dados: unknown) {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
