// Os hooks de dados guardam cópias em memória entre páginas (menos tráfego do Supabase).
// Cada um registra aqui como se esvazia, para os testes começarem sempre do zero.
const limpadores: Array<() => void> = []

export function registrarLimpezaDeCache(limpar: () => void) {
  limpadores.push(limpar)
}

export function limparTodosOsCaches() {
  for (const limpar of limpadores) limpar()
}
