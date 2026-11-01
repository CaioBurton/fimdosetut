import { Link } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { DocumentoLegal, type SecaoLegal } from '../components/legal/DocumentoLegal'
import { CONTATO, CONTROLADOR, FORO, ROTAS_LEGAIS } from '../lib/legal'

const SECOES: SecaoLegal[] = [
  {
    titulo: 'O que é o Deu o Prego!',
    conteudo: (
      <p>
        O Deu o Prego! é um aplicativo colaborativo do {CONTROLADOR.nome} para que as pessoas avisem e
        acompanhem problemas no transporte público de Teresina: ônibus quebrado, acidente, atraso e
        lotação. As informações vêm dos próprios usuários.
      </p>
    ),
  },
  {
    titulo: 'Aceite dos termos',
    conteudo: (
      <p>
        Ao criar uma conta ou usar o app, você declara que leu e concorda com estes Termos de Uso e com
        a{' '}
        <Link to={ROTAS_LEGAIS.privacidade}>Política de Privacidade</Link>. Se não concordar, não use o
        app.
      </p>
    ),
  },
  {
    titulo: 'Sua conta',
    conteudo: (
      <ul>
        <li>Informe dados verdadeiros no cadastro e mantenha-os atualizados.</li>
        <li>Guarde sua senha. Tudo o que for feito na sua conta é de sua responsabilidade.</li>
        <li>Você pode ver o mapa, a lista e o painel sem criar conta. Para reportar, é preciso entrar.</li>
        <li>Uma pessoa deve ter uma única conta.</li>
      </ul>
    ),
  },
  {
    titulo: 'Regras para enviar denúncias e mensagens',
    conteudo: (
      <>
        <p>Ao enviar uma denúncia ou um feedback, você se compromete a:</p>
        <ul>
          <li>relatar fatos reais e marcar o local correto;</li>
          <li>não ofender, ameaçar, discriminar ou expor ninguém;</li>
          <li>não escrever dados pessoais de terceiros (nomes, telefones, documentos);</li>
          <li>não enviar conteúdo ilegal, falso de propósito, repetido em excesso ou propaganda;</li>
          <li>não tentar burlar a segurança do app nem usá-lo de forma automatizada.</li>
        </ul>
        <p>
          <strong>As denúncias são públicas</strong> e aparecem para qualquer visitante, sem o seu nome.
        </p>
      </>
    ),
  },
  {
    titulo: 'Moderação',
    conteudo: (
      <p>
        A administração pode marcar denúncias como resolvidas, apagar conteúdo que descumpra estes termos
        e bloquear ou excluir contas em caso de abuso, sem aviso prévio quando houver risco para outras
        pessoas ou para o app.
      </p>
    ),
  },
  {
    titulo: 'Seu conteúdo',
    conteudo: (
      <p>
        O que você escreve continua sendo seu. Ao enviar uma denúncia, você autoriza o app a exibi-la
        publicamente, no mapa, na lista e no painel, enquanto ela existir. Você pode apagar as suas
        denúncias a qualquer momento na aba Perfil.
      </p>
    ),
  },
  {
    titulo: 'Sobre a exatidão das informações',
    conteudo: (
      <p>
        As denúncias são relatos de usuários e podem estar incompletas ou desatualizadas. O app não é um
        canal oficial da prefeitura ou das empresas de ônibus e não garante que um problema seja
        resolvido. Em emergências, procure os serviços de socorro.
      </p>
    ),
  },
  {
    titulo: 'Disponibilidade e responsabilidade',
    conteudo: (
      <p>
        Fazemos o possível para manter o app no ar, mas ele pode ficar indisponível ou mudar a qualquer
        momento, e é oferecido sem garantias. O {CONTROLADOR.nome} não se responsabiliza por danos
        decorrentes do uso do app ou do conteúdo publicado por usuários, dentro do que a lei permite.
      </p>
    ),
  },
  {
    titulo: 'Marca e identidade visual',
    conteudo: (
      <p>
        O nome, a logo e a identidade visual do Fórum pertencem ao {CONTROLADOR.nome}. Não os use sem
        autorização.
      </p>
    ),
  },
  {
    titulo: 'Mudanças e lei aplicável',
    conteudo: (
      <>
        <p>
          Podemos alterar estes termos. Quando a mudança for relevante, avisaremos no app. Continuar
          usando o app depois do aviso significa que você concorda com a nova versão.
        </p>
        <p>
          Estes termos seguem a lei brasileira. Para resolver conflitos, fica eleito o foro da {FORO}.
        </p>
      </>
    ),
  },
  {
    titulo: 'Contato',
    conteudo: (
      <p>
        Dúvidas sobre estes termos: {CONTATO.email}. Instagram: {CONTATO.instagram}.
      </p>
    ),
  },
]

export function TermosPage() {
  return (
    <AppLayout title="Termos de Uso" largura="estreita">
      <DocumentoLegal
        titulo="Termos de Uso"
        introducao={
          <p>
            Estas são as regras para usar o <strong>Deu o Prego!</strong>. Leia com calma: elas existem
            para o app continuar útil e seguro para todo mundo.
          </p>
        }
        secoes={SECOES}
        outro={{ rotulo: 'Ler também a Política de Privacidade', para: ROTAS_LEGAIS.privacidade }}
      />
    </AppLayout>
  )
}
