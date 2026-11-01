/**
 * Recado para a tela de login (ex.: "Sua conta foi excluída"). Fica na sessão do navegador, e não
 * no estado da rota, porque a saída da conta pode redirecionar para o login por outro caminho
 * antes do nosso redirecionamento.
 */
const CHAVE = 'deu-o-prego:aviso-login'

export function definirAvisoLogin(mensagem: string) {
  try {
    sessionStorage.setItem(CHAVE, mensagem)
  } catch {
    // sem armazenamento: o recado simplesmente não aparece
  }
}

export function lerAvisoLogin(): string | null {
  try {
    return sessionStorage.getItem(CHAVE)
  } catch {
    return null
  }
}

export function limparAvisoLogin() {
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    // ignora
  }
}
